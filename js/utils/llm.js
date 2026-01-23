export class ParseError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'ParseError';
        Object.assign(this, details);
        this.code = this.code || 'PARSE_ERROR';
    }
}

export class RequestBuildError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'RequestBuildError';
        this.code = this.code || 'REQUEST_BUILD_ERROR';
        Object.assign(this, details);
    }
}

const DEFAULT_TIMEOUT_MS = 120000;

function createRequestId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeProvider(baseUrl, providerLabel) {
    if (providerLabel) return providerLabel;
    try {
        const url = new URL(baseUrl);
        return url.host || baseUrl;
    } catch (e) {
        return baseUrl || 'unknown';
    }
}

function previewText(text) {
    if (!text) return '';
    return String(text).slice(0, 500);
}

function previewRequestBody(body) {
    try {
        return JSON.stringify(body).slice(0, 800);
    } catch (e) {
        try {
            return String(body).slice(0, 800);
        } catch (err) {
            return '';
        }
    }
}

function validateMessages(messages) {
    if (!Array.isArray(messages)) {
        return {
            ok: false,
            message: 'Request build error (messages is not an array)',
            details: { messagesType: typeof messages }
        };
    }
    for (let i = 0; i < messages.length; i += 1) {
        const msg = messages[i];
        if (!msg || typeof msg !== 'object') {
            return {
                ok: false,
                message: 'Request build error (messages is malformed)',
                details: { invalidIndex: i, messageType: typeof msg }
            };
        }
        if (typeof msg.content !== 'string') {
            return {
                ok: false,
                message: '请求构造错误（content 不是字符串）',
                details: { invalidIndex: i, contentType: typeof msg.content }
            };
        }
        if (typeof msg.role !== 'string') {
            return {
                ok: false,
                message: '请求构造错误（role 不是字符串）',
                details: { invalidIndex: i, roleType: typeof msg.role }
            };
        }
    }
    return { ok: true };
}

function normalizeText(value) {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) {
        return value
            .map((item) => normalizeText(item?.text || item?.content || item))
            .filter(Boolean)
            .join('');
    }
    if (typeof value === 'object') {
        if (typeof value.text === 'string') return value.text;
        if (typeof value.content === 'string') return value.content;
        if (Array.isArray(value.content)) return normalizeText(value.content);
        return '';
    }
    return String(value);
}

function detectSafetyFiltered(data) {
    const finishReason = data?.choices?.[0]?.finish_reason;
    if (finishReason && /content_filter|safety/i.test(finishReason)) return true;
    const candidateReason = data?.candidates?.[0]?.finishReason;
    if (candidateReason && /safety/i.test(candidateReason)) return true;
    const errorCode = data?.error?.code;
    if (errorCode && /safety|content_filter/i.test(errorCode)) return true;
    return false;
}

function extractTextFromData(data) {
    const candidates = [
        data?.choices?.[0]?.message?.content,
        data?.choices?.[0]?.text,
        data?.choices?.[0]?.delta?.content,
        data?.output_text,
        data?.output?.[0]?.content?.[0]?.text,
        data?.content?.[0]?.text,
        data?.message?.content?.[0]?.text,
        data?.message?.content,
        data?.response,
        data?.result,
        data?.answer,
        data?.data?.choices?.[0]?.message?.content,
        data?.data?.choices?.[0]?.text,
        data?.candidates?.[0]?.content?.parts?.[0]?.text,
        data?.candidates?.[0]?.output,
        data?.generations?.[0]?.text,
        data?.completion,
        data?.text
    ];

    for (const candidate of candidates) {
        const normalized = normalizeText(candidate);
        if (normalized && normalized.trim()) {
            return normalized;
        }
    }

    return '';
}

function parseErrorMessage(responseText) {
    if (!responseText) return '';
    try {
        const data = JSON.parse(responseText);
        return (
            data?.error?.message ||
            data?.message ||
            data?.error ||
            data?.detail ||
            ''
        );
    } catch (e) {
        return '';
    }
}

function buildError(code, message, meta) {
    const error = new Error(message);
    error.code = code;
    Object.assign(error, meta);
    return error;
}

function extractTextTokens(data) {
    if (!data) return null;
    const usage = data.usage || data.usageMetadata || {};
    return (
        usage.completion_tokens ??
        usage.output_tokens ??
        usage.text_tokens ??
        usage.candidatesTokenCount ??
        usage.outputTokenCount ??
        null
    );
}

const DEFAULT_MAX_TOKENS = 8192;

export async function callLLM(request) {
    const {
        baseUrl,
        apiKey,
        model: rawModel,
        messages,
        temperature = 0.7,
        maxTokens = DEFAULT_MAX_TOKENS,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        providerLabel,
        requestId: requestIdOverride
    } = request || {};

    const model = rawModel;

    const requestId = requestIdOverride || createRequestId();
    const provider = normalizeProvider(baseUrl, providerLabel);
    const startTime = (typeof performance !== 'undefined' && performance.now)
        ? performance.now()
        : Date.now();

    const finalizeMeta = (extras = {}) => {
        const now = (typeof performance !== 'undefined' && performance.now)
            ? performance.now()
            : Date.now();
        return {
            requestId,
            provider,
            model,
            durationMs: Math.round(now - startTime),
            ...extras
        };
    };

    let url = (baseUrl || '').replace(/\/+$/, '');
    url = `${url}/chat/completions`;

    const requestBody = {
        model,
        messages,
        temperature: parseFloat(temperature) || 0.7,
        max_tokens: parseInt(maxTokens, 10) || DEFAULT_MAX_TOKENS,
        stream: false
    };
    const requestBodyPreview = previewRequestBody(requestBody);
    const messageValidation = validateMessages(requestBody.messages);
    if (!messageValidation.ok) {
        throw new RequestBuildError(
            messageValidation.message,
            finalizeMeta({
                url,
                requestBodyPreview,
                ...messageValidation.details
            })
        );
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    let responseText = '';

    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        responseText = await response.text();
    } catch (error) {
        clearTimeout(timeoutHandle);
        const baseMeta = finalizeMeta({ url, requestBodyPreview });
        if (error && error.name === 'AbortError') {
            throw buildError('TIMEOUT', '请求超时', baseMeta);
        }
        if (error && /Failed to fetch/i.test(error.message || '')) {
            throw buildError('NETWORK_ERROR', '网络连接失败', baseMeta);
        }
        throw buildError('NETWORK_ERROR', error?.message || '网络请求失败', baseMeta);
    } finally {
        clearTimeout(timeoutHandle);
    }

    const status = response.status;
    const responsePreview = previewText(responseText);
    if (!response.ok) {
        const serverMessage = parseErrorMessage(responseText);
        const errorCode = (status === 401 || status === 403 || status === 451) ? 'BLOCKED' : 'HTTP_ERROR';
        throw buildError(
            errorCode,
            serverMessage || `HTTP ${status}`,
            finalizeMeta({
                status,
                responseTextPreview: responsePreview,
                url,
                requestBodyPreview
            })
        );
    }

    let raw = responseText;
    let parsedJson = false;
    let data;
    if (responseText) {
        try {
            data = JSON.parse(responseText);
            raw = data;
            parsedJson = true;
        } catch (e) {
            parsedJson = false;
        }
    }

    if (parsedJson) {
        const safetyFiltered = detectSafetyFiltered(data);
        if (safetyFiltered) {
            throw buildError(
                'SAFETY_FILTER',
                '内容被安全过滤',
                finalizeMeta({
                    status,
                    responseTextPreview: responsePreview,
                    url,
                    requestBodyPreview
                })
            );
        }

        const text = extractTextFromData(data);
        if (!text || !text.trim()) {
            const finishReason = data?.choices?.[0]?.finish_reason;
            const textTokens = extractTextTokens(data);
            if (finishReason === 'length') {
                throw buildError('EMPTY_TRUNCATED', '空内容被截断', finalizeMeta({
                    status,
                    responseTextPreview: responsePreview,
                    url,
                    requestBodyPreview,
                    finishReason,
                    textTokens
                }));
            }
            throw buildError('EMPTY_CONTENT', '空内容被过滤/被截断', finalizeMeta({
                status,
                responseTextPreview: responsePreview,
                url,
                requestBodyPreview,
                finishReason,
                textTokens
            }));
        }

        const finalText = text.trim();
        return {
            text: finalText,
            raw,
            provider,
            model,
            requestId,
            durationMs: finalizeMeta().durationMs,
            outputLength: finalText.length
        };
    }

    const fallbackText = (responseText || '').trim();
    if (!fallbackText) {
        throw buildError(
            'EMPTY_CONTENT',
            '返回空内容',
            finalizeMeta({
                status,
                responseTextPreview: responsePreview,
                url,
                requestBodyPreview
            })
        );
    }

    return {
        text: fallbackText,
        raw,
        provider,
        model,
        requestId,
        durationMs: finalizeMeta().durationMs,
        outputLength: fallbackText.length
    };
}
