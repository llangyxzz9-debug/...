// QQ 聊天页面（带 AI 对话功能）
import { callLLM } from '../utils/llm.js';

// 独立的消息列表，避免输入时触发整页重渲染
const QQMessageList = {
    name: 'QQMessageList',
    props: {
        messages: {
            type: Array,
            default: () => []
        },
        isLoading: {
            type: Boolean,
            default: false
        },
        role: {
            type: Object,
            default: () => null
        },
        userAvatar: String,
        defaultAvatar: String,
        emojis: {
            type: Array,
            default: () => []
        }
    },
    emits: ['start-long-press', 'cancel-long-press', 'open-message-actions', 'handle-transfer-click'],
    computed: {
        roleAvatar() {
            return this.role?.avatar || this.defaultAvatar;
        },
        emojiMap() {
            const map = new Map();
            (this.emojis || []).forEach((emoji) => {
                if (emoji && emoji.name && emoji.url) {
                    map.set(String(emoji.name), emoji.url);
                }
            });
            return map;
        }
    },
    methods: {
        parseMessageSegments(text) {
            const content = String(text || '');
            const segments = [];
            if (!content) return segments;

            const regex = /\[([^\[\]]+)\]/g;
            let lastIndex = 0;
            let match = null;
            while ((match = regex.exec(content)) !== null) {
                if (match.index > lastIndex) {
                    segments.push({ type: 'text', value: content.slice(lastIndex, match.index) });
                }
                const name = match[1].trim();
                const url = this.emojiMap.get(name);
                if (url) {
                    segments.push({ type: 'emoji', name, url });
                } else {
                    segments.push({ type: 'text', value: match[0] });
                }
                lastIndex = regex.lastIndex;
            }
            if (lastIndex < content.length) {
                segments.push({ type: 'text', value: content.slice(lastIndex) });
            }

            if (segments.length === 1 && segments[0].type === 'emoji') {
                segments[0].isOnly = true;
            }
            return segments;
        },
        formatTransferAmount(value) {
            const amount = Number.parseFloat(value);
            if (!Number.isFinite(amount) || amount <= 0) return '0.00';
            return amount.toFixed(2);
        },
        getTransferStatusText(msg) {
            if (msg.status === 'received') return '已收款';
            if (msg.status === 'refunded') return '已退还';
            return '请收款';
        }
    },
    template: `
        <div class="qq-messages-container">
            <div 
                v-for="(msg, index) in messages" 
                :key="msg.timestamp ?? index" 
                class="qq-message-row"
                :class="{ 'me': msg.role === 'user', 'ai': msg.role === 'assistant' }"
            >
                <div class="qq-msg-avatar" :class="{ 'me': msg.role === 'user' }" :style="{ backgroundImage: 'url(' + (msg.role === 'user' ? userAvatar : roleAvatar) + ')' }"></div>
                
                <div
                    class="qq-bubble"
                    :class="{ 'me': msg.role === 'user', 'ai': msg.role === 'assistant', 'is-transfer': msg.type === 'transfer' }"
                    @pointerdown="$emit('start-long-press', index)"
                    @pointerup="$emit('cancel-long-press')"
                    @pointerleave="$emit('cancel-long-press')"
                    @pointercancel="$emit('cancel-long-press')"
                    @contextmenu.prevent="$emit('open-message-actions', index)"
                >
                    <div class="qq-bubble-content">
                        <template v-if="msg.type === 'transfer'">
                            <div 
                                class="qq-transfer-card" 
                                :class="{ 'is-received': msg.status === 'received', 'is-refunded': msg.status === 'refunded' }"
                                @click.stop="$emit('handle-transfer-click', msg, index)"
                            >
                                <div class="qq-transfer-body">
                                    <div class="qq-transfer-symbol">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                        </svg>
                                    </div>
                                    <div class="qq-transfer-info">
                                        <div class="qq-transfer-amount">¥{{ formatTransferAmount(msg.amount) }}</div>
                                        <div v-if="msg.note" class="qq-transfer-note">{{ msg.note }}</div>
                                    </div>
                                </div>
                                <div class="qq-transfer-footer">{{ getTransferStatusText(msg) }}</div>
                            </div>
                        </template>
                        <template v-else>
                            <template v-for="(segment, segIndex) in parseMessageSegments(msg.content)" :key="segIndex">
                                <span v-if="segment.type === 'text'">{{ segment.value }}</span>
                                <img
                                    v-else
                                    class="qq-emoji-inline"
                                    :class="{ 'is-only': segment.isOnly }"
                                    :src="segment.url"
                                    :alt="segment.name"
                                    :title="segment.name"
                                />
                            </template>
                        </template>
                    </div>
                </div>
            </div>

            <div v-if="isLoading" class="qq-message-row ai">
                <div class="qq-msg-avatar" :style="{ backgroundImage: 'url(' + roleAvatar + ')' }"></div>
                <div class="qq-bubble ai loading">
                    <div class="qq-typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        </div>
    `
};

export const QQChatPage = {
    components: {
        QQMessageList
    },
    template: `
        <div class="qq-chat-page" @click="handleChatPageClick">
            <div class="qq-header">
                <div class="qq-header-left" @click="onBack && onBack()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </div>
                <div class="qq-title">{{ role?.name || '聊天' }}</div>
                <div class="qq-header-actions">
                    <!-- 右上角：设置图标 -->
                    <span class="qq-action-btn" aria-label="聊天设置" @click="onOpenChatSettings && onOpenChatSettings()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                             viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="4" y1="6" x2="20" y2="6"></line>
                            <line x1="4" y1="12" x2="20" y2="12"></line>
                            <line x1="4" y1="18" x2="20" y2="18"></line>
                        </svg>
                    </span>
                </div>
            </div>

            <div class="qq-chat-body" :style="chatBodyStyle" ref="chatBody">
                <div v-if="!role" class="qq-chat-empty">未选择角色</div>

                <template v-else>
                    <!-- 消息列表（延迟渲染，让页面框架先显示） -->
                    <QQMessageList
                        v-if="pageReady"
                        :messages="renderMessages"
                        :is-loading="isLoading"
                        :role="role"
                        :user-avatar="userAvatar"
                        :default-avatar="defaultAvatar"
                        :emojis="emojiAllList"
                        @start-long-press="startLongPress"
                        @cancel-long-press="cancelLongPress"
                        @open-message-actions="openMessageActions"
                        @handle-transfer-click="handleTransferClick"
                    />
                </template>
            </div>

            <div class="qq-chat-tools" :class="{ 'is-open': showTools }">
                <div class="qq-chat-tools-grid">
                    <button class="qq-tool-item" type="button" :class="{ 'is-active': showEmojiPanel }" @click.stop="toggleEmojiPanel">
                        <span class="qq-tool-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                        </span>
                        <span class="qq-tool-label">表情</span>
                    </button>
                    <button class="qq-tool-item" type="button" @click.stop="retryLastUserMessage">
                        <span class="qq-tool-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                        </span>
                        <span class="qq-tool-label">重回</span>
                    </button>
                    <button class="qq-tool-item" type="button" @click.stop="openTransferModal">
                        <span class="qq-tool-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                        </span>
                        <span class="qq-tool-label">转账</span>
                    </button>
                    <button class="qq-tool-item" type="button">
                        <span class="qq-tool-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        </span>
                        <span class="qq-tool-label">定位</span>
                    </button>
                    <button class="qq-tool-item" type="button">
                        <span class="qq-tool-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        </span>
                        <span class="qq-tool-label">图片</span>
                    </button>
                    <button class="qq-tool-item" type="button">
                        <span class="qq-tool-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                        </span>
                        <span class="qq-tool-label">语音</span>
                    </button>
                    <button class="qq-tool-item" type="button">
                        <span class="qq-tool-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
                        </span>
                        <span class="qq-tool-label">线下</span>
                    </button>
                </div>
            </div>

            <div
                v-if="showEmojiPanel"
                class="qq-emoji-panel"
                :class="{ 'is-move-mode': emojiMoveMode }"
                @click="handleEmojiPanelClick"
                @pointermove="handleEmojiDragMove"
                @pointerup="endEmojiDrag"
                @pointercancel="endEmojiDrag"
                @touchmove="handleEmojiDragMove"
                @touchend="endEmojiDrag"
                @touchcancel="endEmojiDrag"
            >
                <div class="qq-emoji-header">
                    <div class="qq-emoji-title" @click="toggleEmojiCategory">{{ emojiTitle }}</div>
                    <div class="qq-emoji-header-actions">
                        <button
                            v-if="!emojiMultiSelect"
                            class="qq-emoji-header-btn"
                            type="button"
                            @click="enterEmojiMultiSelect"
                        >
                            多选
                        </button>
                        <template v-else>
                            <button class="qq-emoji-header-btn" type="button" @click="selectAllEmojis">全选</button>
                            <button
                                class="qq-emoji-header-btn ghost"
                                type="button"
                                :disabled="selectedEmojiKeys.size === 0"
                                @click="deleteSelectedEmojis"
                            >
                                删除
                            </button>
                            <button class="qq-emoji-header-btn ghost" type="button" @click="exitEmojiMultiSelect">取消</button>
                        </template>
                        <button
                            v-if="!emojiMultiSelect"
                            class="qq-emoji-header-btn ghost"
                            type="button"
                            @click="closeEmojiPanel"
                        >
                            取消
                        </button>
                    </div>
                </div>

                <div class="qq-emoji-grid">
                    <button
                        class="qq-emoji-item is-add"
                        type="button"
                        @click="openEmojiAddSheet"
                        title="添加表情"
                    >
                        <span class="qq-emoji-add">+</span>
                    </button>
                    <button
                        v-for="emoji in displayedEmojis"
                        :key="emoji.id || emoji.name"
                        class="qq-emoji-item"
                        :class="{
                            'is-dragging': isDraggingEmoji && displayedEmojis.indexOf(emoji) === dragIndex,
                            'is-drop-target': isDraggingEmoji && displayedEmojis.indexOf(emoji) === dragOverIndex,
                            'is-move-source': emojiMoveMode && displayedEmojis.indexOf(emoji) === dragIndex,
                            'is-selected': emojiMultiSelect && isEmojiSelected(emoji)
                        }"
                        type="button"
                        :data-emoji-index="displayedEmojis.indexOf(emoji)"
                        @click="handleEmojiClick(emoji)"
                        @pointerdown="startEmojiPress($event, emoji)"
                        @pointerup="endEmojiPress"
                        @pointerleave="cancelEmojiPress"
                        @pointercancel="cancelEmojiPress"
                        @pointermove="trackEmojiPressMove($event)"
                        @touchstart="startEmojiPress($event, emoji)"
                        @touchend="endEmojiPress"
                        @touchcancel="cancelEmojiPress"
                        @touchmove="trackEmojiPressMove($event)"
                        :title="emoji.name"
                    >
                        <img class="qq-emoji-thumb" :src="emoji.url" :alt="emoji.name" />
                        <span class="qq-emoji-name">{{ emoji.name }}</span>
                    </button>
                </div>
                <div v-if="!displayedEmojis.length" class="qq-emoji-empty">还没有添加表情</div>

            </div>

            <div class="qq-chat-inputbar">
                <button class="qq-chat-tool-toggle" type="button" :class="{ 'is-open': showTools }" @click="toggleTools">
                    <span class="qq-chat-plus">+</span>
                </button>
                <input 
                    class="qq-chat-input" 
                    v-model="inputText"
                    placeholder="输入消息..." 
                    :disabled="!role || isLoading"
                    @keyup.enter="sendMessage"
                />
                <button 
                    class="qq-chat-send" 
                    :class="{ 'is-input': hasInput }"
                    :disabled="sendButtonDisabled"
                    @click="handleSendButton"
                >
                    发送
                </button>
            </div>

            <input
                ref="emojiFileInput"
                class="file-input"
                type="file"
                accept="image/*"
                multiple
                @change="handleEmojiFileChange"
            />

            <!-- API 未配置提示 -->
            <div v-if="showApiWarning" class="qq-api-warning" @click="showApiWarning = false">
                <div class="qq-api-warning-content" @click.stop>
                    <div class="qq-api-warning-icon">⚠️</div>
                    <div class="qq-api-warning-text">
                        <div class="qq-api-warning-title">API 未配置</div>
                        <div class="qq-api-warning-desc">请先在主页的 API 设置中配置 Base URL、API Key 和模型名称</div>
                    </div>
                    <button class="qq-api-warning-btn" @click="showApiWarning = false">知道了</button>
                </div>
            </div>

            <!-- API/回复异常提示 -->
            <div v-if="showReplyError" class="qq-api-warning" @click="showReplyError = false">
                <div class="qq-api-warning-content" @click.stop>
                    <div class="qq-api-warning-icon">!</div>
                    <div class="qq-api-warning-text">
                        <div class="qq-api-warning-title">回复异常</div>
                        <div class="qq-api-warning-desc">{{ replyErrorMessage }}</div>
                    </div>
                    <div class="qq-api-warning-actions">
                        <button class="qq-api-warning-btn secondary" @click="copyDiagnostics">{{ replyErrorCopyText }}</button>
                        <button v-if="replyErrorRequestBodyPreview" class="qq-api-warning-btn secondary" @click="copyRequestBodyPreview">{{ replyErrorRequestBodyCopyText }}</button>
                        <button class="qq-api-warning-btn" @click="showReplyError = false">知道了</button>
                    </div>
                </div>
            </div>

            <div v-if="showTransferModal" class="qq-transfer-mask" @click="closeTransferModal">
                <div class="qq-transfer-modal" @click.stop>
                    <div class="qq-transfer-modal-title">转账</div>
                    <div class="qq-transfer-target">
                        <div
                            class="qq-transfer-avatar"
                            :style="{ backgroundImage: 'url(' + (role?.avatar || defaultAvatar) + ')' }"
                        ></div>
                        <div class="qq-transfer-name">{{ role?.name || '对方' }}</div>
                    </div>
                    <div class="qq-transfer-input-block">
                        <div class="qq-transfer-label">金额</div>
                        <div class="qq-transfer-amount-input">
                            <span class="qq-transfer-currency">¥</span>
                            <input
                                class="qq-transfer-input"
                                type="number"
                                inputmode="decimal"
                                step="0.01"
                                placeholder="0.00"
                                v-model="transferAmount"
                            />
                        </div>
                    </div>
                    <div class="qq-transfer-input-block">
                        <div class="qq-transfer-label">备注</div>
                        <input
                            class="qq-transfer-note-input"
                            type="text"
                            placeholder="填写转账备注"
                            v-model="transferNote"
                        />
                    </div>
                    <div v-if="transferError" class="qq-transfer-error">{{ transferError }}</div>
                    <div class="qq-transfer-actions">
                        <button class="qq-transfer-cancel" type="button" @click="closeTransferModal">取消</button>
                        <button class="qq-transfer-confirm" type="button" @click="submitTransfer">确定转账</button>
                    </div>
                </div>
            </div>

            <!-- 消息长按操作 -->
            <div v-if="showTransferActionSheet" class="qq-action-sheet-mask" @click="closeTransferActionSheet">
                <div class="qq-action-sheet" @click.stop>
                    <div class="qq-action-sheet-title">转账操作</div>
                    <button class="qq-action-sheet-btn" @click="confirmReceiveTransfer">确认收款</button>
                    <button class="qq-action-sheet-btn danger" @click="refundTransfer">退还转账</button>
                    <button class="qq-action-sheet-cancel" @click="closeTransferActionSheet">取消</button>
                </div>
            </div>

            <div v-if="showMessageActions" class="qq-action-sheet-mask" @click="closeMessageActions">
                <div class="qq-action-sheet" @click.stop>
                    <div class="qq-action-sheet-title">消息操作</div>
                    <button class="qq-action-sheet-btn" @click="editMessage">编辑</button>
                    <button class="qq-action-sheet-btn danger" @click="deleteMessage">删除</button>
                    <button class="qq-action-sheet-cancel" @click="closeMessageActions">取消</button>
                </div>
            </div>

            <div v-if="showEmojiAddSheet" class="qq-action-sheet-mask" @click="closeEmojiAddSheet">
                <div class="qq-action-sheet qq-emoji-add-sheet" @click.stop>
                    <div class="qq-action-sheet-title">添加表情</div>
                    <div class="qq-emoji-upload-group">
                        <label class="qq-emoji-upload-option">
                            <input type="radio" value="mine" v-model="emojiUploadCategory" />
                            我的表情
                        </label>
                        <label class="qq-emoji-upload-option">
                            <input type="radio" value="common" v-model="emojiUploadCategory" />
                            通用表情
                        </label>
                        <label class="qq-emoji-upload-option">
                            <input type="radio" value="role" v-model="emojiUploadCategory" />
                            {{ role?.name || '角色' }}的表情
                        </label>
                    </div>
                    <button class="qq-action-sheet-btn" @click="triggerEmojiUpload">本地上传</button>
                    <textarea
                        class="qq-emoji-url-text"
                        v-model="emojiUrlText"
                        placeholder="表情名:URL（一行一个）"
                    ></textarea>
                    <button class="qq-action-sheet-btn" @click="addEmojiFromUrlText">添加 URL</button>
                    <button class="qq-action-sheet-cancel" @click="closeEmojiAddSheet">取消</button>
                </div>
            </div>

            <div v-if="showEmojiPopover" class="qq-emoji-popover" :style="emojiPopoverStyle" @click.stop>
                <div class="qq-emoji-popover-actions">
                    <button class="qq-emoji-popover-btn" type="button" @click="renameEmoji">重命名</button>
                    <button class="qq-emoji-popover-btn" type="button" @click="enterEmojiMoveMode">移动</button>
                    <button class="qq-emoji-popover-btn danger" type="button" @click="deleteEmoji">删除</button>
                </div>
            </div>
        </div>
    `,
    props: {
        onBack: Function,
        role: Object,
        worldBooks: {
            type: Array,
            default: () => []
        },
        onOpenChatSettings: Function,
        onUpdateRole: Function,
        messagesCache: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            // iOS风格默认头像 - 使用SVG data URI
            defaultAvatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%23C7C7CC'/%3E%3Ccircle cx='30' cy='24' r='10' fill='%23fff'/%3E%3Cpath d='M30 36c-10 0-18 6-18 14v2h36v-2c0-8-8-14-18-14z' fill='%23fff'/%3E%3C/svg%3E",
            userAvatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%23007AFF'/%3E%3Ccircle cx='30' cy='24' r='10' fill='%23fff'/%3E%3Cpath d='M30 36c-10 0-18 6-18 14v2h36v-2c0-8-8-14-18-14z' fill='%23fff'/%3E%3C/svg%3E",
            inputText: '',
            messages: [],
            isLoading: false,
            showApiWarning: false,
            showReplyError: false,
            replyErrorMessage: '',
            replyErrorDiagnostics: '',
            replyErrorCopyText: '复制诊断信息',
            replyErrorRequestBodyPreview: '',
            replyErrorRequestBodyCopyText: '复制请求体预览',
            lastRequestBodyPreview: '',
            showTools: false,
            showEmojiPanel: false,
            showEmojiUrlInput: false,
            emojiUrlText: '',
            emojiCategory: 'mine',
            emojiUploadCategory: 'mine',
            myEmojis: [],
            commonEmojis: [],
            roleEmojis: [],
            showEmojiAddSheet: false,
            showEmojiPopover: false,
            emojiPopoverStyle: {},
            emojiActionTarget: null,
            emojiPressTimer: null,
            emojiPressTriggered: false,
            emojiPressStart: null,
            emojiPressTargetEl: null,
            emojiPressTargetEmoji: null,
            emojiPressStartTime: 0,
            isDraggingEmoji: false,
            dragIndex: -1,
            dragOverIndex: -1,
            dragCategory: '',
            emojiDragStart: null,
            emojiMoveMode: false,
            emojiMultiSelect: false,
            selectedEmojiKeys: new Set(),
            bubbleStyleTagId: 'qq-bubble-style',
            showTransferModal: false,
            transferAmount: '',
            transferNote: '',
            transferError: '',
            showTransferActionSheet: false,
            currentTransferMsg: null,
            currentTransferIndex: -1,
            showMessageActions: false,
            activeMessageIndex: null,
            longPressTimer: null,
            // 渲染窗口（只展示末尾消息，避免超长记录导致渲染卡顿）
            visibleMessages: [],
            messageWindowOffset: 0,
            messageWindowEnd: 0,
            // 每次渲染的消息数量（初始显示）- 200条足够大部分聊天场景
            messageWindowLimit: 200,
            // 每次加载更多的消息数量
            loadMoreCount: 50,
            loadingMore: false,
            chatScrollHandler: null,
            // 防抖保存定时器
            saveDebounceTimer: null,
            // 页面初始化状态（用于延迟渲染消息，让页面框架先显示）
            pageReady: false,
            // 预加载阈值（距离顶部多少像素时开始预加载）
            preloadThreshold: 300
        };
    },
    computed: {
        chatBodyStyle() {
            const wallpaper = this.role && this.role.chatWallpaper;
            if (!wallpaper) return {};
            return {
                backgroundImage: `url(${wallpaper})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            };
        },
        emojiTitle() {
            if (this.emojiCategory === 'role') {
                const name = this.role?.name || '角色';
                return `${name}的表情`;
            }
            return '我的表情';
        },
        canReply() {
            return !!this.role && !this.isLoading && this.messages.length > 0;
        },
        hasInput() {
            return !!this.inputText && !!this.inputText.trim();
        },
        sendButtonDisabled() {
            if (!this.role || this.isLoading) return true;
            return this.hasInput ? false : !this.canReply;
        },
        // 为消息列表创建只在内容变动时变化的引用，避免输入时重新渲染整列气泡
        renderMessages() {
            return this.visibleMessages;
        },
        multiSelectButtonText() {
            if (!this.emojiMultiSelect) return '多选';
            const count = this.selectedEmojiKeys.size;
            return count ? `删除(${count})` : '多选';
        },
        displayedEmojis() {
            const common = (this.commonEmojis || []).map((emoji) => ({ ...emoji, category: 'common' }));
            if (this.emojiCategory === 'role') {
                const role = (this.roleEmojis || []).map((emoji) => ({ ...emoji, category: 'role' }));
                return [...role, ...common];
            }
            const mine = (this.myEmojis || []).map((emoji) => ({ ...emoji, category: 'mine' }));
            return [...mine, ...common];
        },
        emojiAllList() {
            return [
                ...(this.myEmojis || []),
                ...(this.commonEmojis || []),
                ...(this.roleEmojis || [])
            ];
        }
    },
    watch: {
        role: {
            immediate: true,
            handler(newRole) {
                if (newRole && newRole.id) {
                    this.loadMessages();
                } else {
                    this.messages = [];
                }
                this.roleEmojis = Array.isArray(newRole?.emojis) ? newRole.emojis : [];
                this.loadEmojiCollections();
                if (!newRole && this.emojiCategory === 'role') {
                    this.emojiCategory = 'mine';
                }
                this.applyBubbleCss();
            }
        }
    },
    methods: {
        loadEmojiCollections() {
            try {
                const savedMine = localStorage.getItem('qqMyEmojis');
                const savedCommon = localStorage.getItem('qqCommonEmojis');
                this.myEmojis = savedMine ? JSON.parse(savedMine) || [] : [];
                this.commonEmojis = savedCommon ? JSON.parse(savedCommon) || [] : [];
            } catch (e) {
                this.myEmojis = [];
                this.commonEmojis = [];
            }
        },

        getCategoryList(category) {
            if (category === 'common') return this.commonEmojis || [];
            if (category === 'role') return this.roleEmojis || [];
            return this.myEmojis || [];
        },

        setCategoryList(category, list) {
            const normalized = (list || []).map((emoji) => ({
                ...emoji,
                category
            }));
            if (category === 'role') {
                this.roleEmojis = normalized;
                if (this.onUpdateRole && this.role?.id) {
                    this.onUpdateRole({ emojis: normalized });
                }
                return;
            }

            if (category === 'common') {
                this.commonEmojis = normalized;
                try {
                    localStorage.setItem('qqCommonEmojis', JSON.stringify(normalized));
                } catch (e) {}
                return;
            }

            this.myEmojis = normalized;
            try {
                localStorage.setItem('qqMyEmojis', JSON.stringify(normalized));
            } catch (e) {}
        },

        getActiveEmojiList() {
            return this.getCategoryList(this.emojiCategory);
        },

        setActiveEmojiList(list) {
            this.setCategoryList(this.emojiCategory, list);
        },

        toggleEmojiCategory() {
            this.emojiCategory = this.emojiCategory === 'mine' ? 'role' : 'mine';
        },
        // 应用自定义气泡 CSS（按当前角色）
        applyBubbleCss() {
            const css = (this.role && this.role.bubbleCss) ? this.role.bubbleCss.trim() : '';
            const existing = document.getElementById(this.bubbleStyleTagId);

            if (!css) {
                if (existing) existing.remove();
                return;
            }

            const styleTag = existing || document.createElement('style');
            styleTag.id = this.bubbleStyleTagId;
            styleTag.textContent = css;
            const customStyle = document.getElementById('custom-user-css');
            if (customStyle && customStyle.parentNode === document.head) {
                if (styleTag.parentNode !== document.head) {
                    document.head.insertBefore(styleTag, customStyle.nextSibling);
                } else if (customStyle.nextSibling !== styleTag) {
                    document.head.removeChild(styleTag);
                    document.head.insertBefore(styleTag, customStyle.nextSibling);
                }
            } else if (styleTag.parentNode !== document.head) {
                document.head.appendChild(styleTag);
            }
        },
        // 加载聊天记录（优先从缓存读取，避免重复解析 JSON）
        loadMessages() {
            if (!this.role || !this.role.id) return;
            
            const roleId = this.role.id;
            
            // 优先从缓存读取（QQApp 在显示消息列表时已经解析并缓存）
            const cached = this.messagesCache && this.messagesCache[roleId];
            if (cached && cached.messages) {
                // 直接使用缓存的消息数组，无需再次解析 JSON
                this.messages = cached.messages;
                this.resetVisibleWindowToLatest();
                this.$nextTick(() => this.scrollToBottom());
                return;
            }
            
            // 缓存未命中，从 localStorage 加载
            this.messages = [];
            this.visibleMessages = [];
            
            const key = `chat_${roleId}`;
            const saved = localStorage.getItem(key);
            
            if (!saved) {
                this.resetVisibleWindowToLatest();
                return;
            }
            
            // 使用 setTimeout 将 JSON 解析放到下一个事件循环，避免阻塞渲染
            setTimeout(() => {
                try {
                    this.messages = JSON.parse(saved);
                    // 解析后也存入缓存
                    if (this.messagesCache) {
                        this.messagesCache[roleId] = {
                            messages: this.messages,
                            timestamp: Date.now()
                        };
                    }
                } catch (e) {
                    console.error('加载聊天记录失败:', e);
                    this.messages = [];
                }
                this.resetVisibleWindowToLatest();
                this.$nextTick(() => this.scrollToBottom());
            }, 0);
        },

        // 保存聊天记录（带防抖，避免频繁写入，同时更新缓存）
        saveMessages(immediate = false) {
            if (!this.role || !this.role.id) return;
            
            const roleId = this.role.id;
            
            const doSave = () => {
                try {
                    const key = `chat_${roleId}`;
                    localStorage.setItem(key, JSON.stringify(this.messages));
                    // 同时更新缓存
                    if (this.messagesCache) {
                        this.messagesCache[roleId] = {
                            messages: this.messages,
                            timestamp: Date.now()
                        };
                    }
                } catch (e) {
                    console.error('保存聊天记录失败:', e);
                }
            };

            if (immediate) {
                if (this.saveDebounceTimer) {
                    clearTimeout(this.saveDebounceTimer);
                    this.saveDebounceTimer = null;
                }
                doSave();
            } else {
                if (this.saveDebounceTimer) {
                    clearTimeout(this.saveDebounceTimer);
                }
                this.saveDebounceTimer = setTimeout(doSave, 300);
            }
        },

        // 清空聊天记录
        clearMessages() {
            if (!this.role || !this.role.id) return;
            if (!confirm('确定要清空所有聊天记录吗？')) return;
            this.messages = [];
            this.recomputeVisibleMessages();
            this.saveMessages();
        },

        // 滚动到底部
        scrollToBottom() {
            this.$nextTick(() => {
                const chatBody = this.$refs.chatBody;
                if (chatBody) {
                    chatBody.scrollTop = chatBody.scrollHeight;
                }
            });
        },

        // 获取 API 设置
        getApiSettings() {
            try {
                const saved = localStorage.getItem('apiSettings');
                if (saved) {
                    const data = JSON.parse(saved);
                    if (data && !data.modelName && data.model) {
                        data.modelName = data.model; // 兼容旧字段
                    }
                    return data;
                }
            } catch (e) {
                console.error('获取 API 设置失败:', e);
            }
            return null;
        },

        // 构建系统提示词
        buildSystemPrompt() {
            const globalPrompt = this.getGlobalSystemPrompt();
            if (globalPrompt) return globalPrompt;

            const parts = [];
            
            // 角色设定（对方人设）
            const aiPersona = this.role?.setting || this.role?.aiPersona || '';
            if (aiPersona) {
                parts.push(`你是${this.role.name}。以下是你的人设：\n${aiPersona}`);
            } else {
                parts.push(`你是${this.role.name}。请以这个身份与用户对话。`);
            }

            // 用户人设（我的人设）
            const myPersona = this.role?.myPersona || '';
            if (myPersona) {
                parts.push(`\n\n与你对话的用户的信息：\n${myPersona}`);
            }

            // 添加一些基本指令
            parts.push('\n\n请保持角色扮演，用自然、口语化的方式回复。回复不要太长，像正常聊天一样。');
            parts.push('请将回复拆成多条短消息，每条消息单独一行，不要加序号或列表字符。');
            
            // 转账功能指令
            parts.push('\n\n【转账功能】');
            parts.push('1. 如果你想给用户转账，请在回复中包含标签：[TRANSFER:金额:备注]，例如 [TRANSFER:100:拿去买糖]（金额为数字）。前端会自动将其渲染为转账卡片。');
            parts.push('2. 如果用户给你转账，你可以决定是否收款。');
            parts.push('   - 确认收款：请在回复中包含 [收款] 或 [CONFIRM_RECEIPT]。');
            parts.push('   - 退还转账：请在回复中包含 [退还] 或 [REFUND]。');
            parts.push('   - 你也可以选择暂不处理（不包含上述标签）。');

            const worldBookText = this.buildWorldBookContext();
            if (worldBookText) {
                parts.push(worldBookText);
            }

            return parts.join('');
        },

        getGlobalSystemPrompt() {
            try {
                const saved = localStorage.getItem('qqGlobalSystemPrompt');
                return (saved || '').trim();
            } catch (e) {
                console.error('读取全局提示词失败:', e);
                return '';
            }
        },

        buildWorldBookContext() {
            const books = this.getBoundWorldBooks();
            if (!books.length) return '';

            // 性能优化：只取最近的消息用于关键词匹配（避免遍历全部消息）
            const recentMessages = this.messages.slice(-30);
            const textPool = recentMessages.map(m => m.content || '').join('\n');
            const lowerPool = textPool.toLowerCase();
            const sections = [];

            books.forEach((book) => {
                const groupLines = [];
                (book.groups || []).forEach((group) => {
                    const entryLines = [];
                    (group.entries || []).forEach((entry) => {
                        if (entry && entry.enabled === false) return;
                        if (!entry) return;
                        const content = (entry.content || '').trim();
                        if (!content) return;
                        if (!this.shouldIncludeWorldBookEntry(entry, textPool, lowerPool)) return;
                        const title = (entry.name || (entry.keywords && entry.keywords[0]) || '条目').trim();
                        const keywords = Array.isArray(entry.keywords) ? entry.keywords.filter(Boolean) : [];
                        entryLines.push(`- 词条: ${title}`);
                        if (keywords.length) {
                            entryLines.push(`  关键词: ${keywords.join('、')}`);
                        }
                        entryLines.push(`  内容: ${content}`);
                    });
                    if (entryLines.length) {
                        if (group && group.name) {
                            groupLines.push(`【分组: ${group.name}】`);
                        }
                        groupLines.push(...entryLines);
                    }
                });
                if (groupLines.length) {
                    sections.push(`【WorldBook: ${book.name || '未命名'}】`);
                    sections.push(...groupLines);
                }
            });

            if (!sections.length) return '';
            return `\n\n${sections.join('\n')}`;
        },

        getBoundWorldBooks() {
            const ids = Array.isArray(this.role?.worldBookIds) ? this.role.worldBookIds : [];
            if (!ids.length) return [];
            return (this.worldBooks || []).filter(b => ids.includes(b.id));
        },

        shouldIncludeWorldBookEntry(entry, textPool, lowerPool) {
            if (entry.always) return true;
            const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
            if (!keywords.length) return false;
            const haystack = lowerPool;
            return keywords.some((key) => {
                if (!key) return false;
                const needle = String(key).toLowerCase();
                return haystack.includes(needle);
            });
        },

        // 发送消息（只添加用户消息，不立即回复）
        // 优化：使用 requestAnimationFrame 分离 UI 更新和数据操作，避免按钮卡顿
        sendMessage() {
            if (this.isLoading || !this.role) return;
            const text = this.inputText.trim();
            if (!text) return;

            // 立即清空输入框，给用户即时反馈
            this.inputText = '';
            
            // 使用 requestAnimationFrame 将消息添加和渲染放到下一帧
            // 这样按钮点击的视觉反馈不会被阻塞
            requestAnimationFrame(() => {
                this.messages.push({
                    role: 'user',
                    content: text,
                    timestamp: Date.now()
                });

                this.resetVisibleWindowToLatest();
                this.scrollToBottom();
                
                // 保存操作放到更后面，避免阻塞渲染
                requestAnimationFrame(() => {
                    this.saveMessages();
                });
            });
        },

        handleSendButton() {
            if (this.hasInput) {
                this.sendMessage();
                return;
            }
            this.requestReply();
        },

        openTransferModal() {
            if (this.isLoading || !this.role) return;
            this.showTools = false;
            this.closeEmojiPanel();
            this.transferAmount = '';
            this.transferNote = '';
            this.transferError = '';
            this.showTransferModal = true;
        },

        closeTransferModal() {
            this.showTransferModal = false;
            this.transferError = '';
        },

        submitTransfer() {
            if (!this.role || this.isLoading) return;
            const amountValue = Number.parseFloat(this.transferAmount);
            if (!Number.isFinite(amountValue) || amountValue <= 0) {
                this.transferError = '请输入有效金额';
                return;
            }

            const noteValue = (this.transferNote || '').trim();
            const amountText = amountValue.toFixed(2);
            const contentText = noteValue ? `转账 ¥${amountText}，备注：${noteValue}` : `转账 ¥${amountText}`;
            this.messages.push({
                role: 'user',
                type: 'transfer',
                status: 'pending',
                amount: amountValue,
                note: noteValue,
                content: contentText,
                timestamp: Date.now()
            });

            this.resetVisibleWindowToLatest();
            this.scrollToBottom();
            this.saveMessages();

            this.transferAmount = '';
            this.transferNote = '';
            this.transferError = '';
            this.showTransferModal = false;
        },

        buildTransferResponseMessage(originalMsg, action, receiverRole) {
            const amountValue = Number.parseFloat(originalMsg?.amount);
            const amount = Number.isFinite(amountValue) ? amountValue : 0;
            const amountText = amount.toFixed(2);
            const noteValue = (originalMsg?.note || '').trim();
            const actionLabel = action === 'refunded' ? '退还' : '收款';
            const contentText = noteValue
                ? `${actionLabel} ¥${amountText}，备注：${noteValue}`
                : `${actionLabel} ¥${amountText}`;

            return {
                role: receiverRole,
                type: 'transfer',
                status: action,
                amount,
                note: noteValue,
                content: contentText,
                timestamp: Date.now()
            };
        },

        handleTransferClick(msg, index) {
            // 用户自己发的转账，点击无操作（等待角色处理）
            if (msg.role === 'user') {
                return;
            }
            // 角色发的转账，且未处理时，弹出操作菜单
            if (msg.status === 'received' || msg.status === 'refunded') {
                return;
            }
            if (msg.resolution === 'received' || msg.resolution === 'refunded') {
                return;
            }
            this.currentTransferMsg = msg;
            this.currentTransferIndex = this.messageWindowOffset + index;
            this.showTransferActionSheet = true;
        },

        confirmReceiveTransfer() {
            if (this.currentTransferIndex === -1 || !this.currentTransferMsg) return;
            
            const fullIndex = this.currentTransferIndex;
            const originalMsg = this.messages[fullIndex];
            if (originalMsg) {
                if (originalMsg.status === 'received' || originalMsg.status === 'refunded') {
                    this.closeTransferActionSheet();
                    return;
                }
                if (originalMsg.resolution === 'received' || originalMsg.resolution === 'refunded') {
                    this.closeTransferActionSheet();
                    return;
                }
                originalMsg.resolution = 'received';
                const receiverRole = originalMsg.role === 'assistant' ? 'user' : 'assistant';
                this.messages.push(this.buildTransferResponseMessage(originalMsg, 'received', receiverRole));
                this.resetVisibleWindowToLatest();
                this.scrollToBottom();
                this.saveMessages();
            }
            
            this.closeTransferActionSheet();
        },

        refundTransfer() {
            if (this.currentTransferIndex === -1 || !this.currentTransferMsg) return;
            
            const fullIndex = this.currentTransferIndex;
            const originalMsg = this.messages[fullIndex];
            if (originalMsg) {
                if (originalMsg.status === 'received' || originalMsg.status === 'refunded') {
                    this.closeTransferActionSheet();
                    return;
                }
                if (originalMsg.resolution === 'received' || originalMsg.resolution === 'refunded') {
                    this.closeTransferActionSheet();
                    return;
                }
                originalMsg.resolution = 'refunded';
                const receiverRole = originalMsg.role === 'assistant' ? 'user' : 'assistant';
                this.messages.push(this.buildTransferResponseMessage(originalMsg, 'refunded', receiverRole));
                this.resetVisibleWindowToLatest();
                this.scrollToBottom();
                this.saveMessages();
            }
            
            this.closeTransferActionSheet();
        },

        closeTransferActionSheet() {
            this.showTransferActionSheet = false;
            this.currentTransferMsg = null;
            this.currentTransferIndex = -1;
        },

        retryLastUserMessage() {
            if (this.isLoading || !this.role) return;

            let lastUserIndex = -1;
            for (let i = this.messages.length - 1; i >= 0; i -= 1) {
                if (this.messages[i]?.role === 'user') {
                    lastUserIndex = i;
                    break;
                }
            }
            if (lastUserIndex < 0) return;

            const lastUserMsg = this.messages[lastUserIndex];
            const lastUserContent = (lastUserMsg?.content || '').trim();
            if (!lastUserContent) return;

            this.messages.splice(lastUserIndex);
            this.resetVisibleWindowToLatest();
            this.saveMessages();
            this.scrollToBottom();

            this.showTools = false;
            this.closeEmojiPanel();

            if (lastUserMsg?.type === 'transfer') {
                this.messages.push({
                    ...lastUserMsg,
                    timestamp: Date.now()
                });
            } else {
                this.messages.push({
                    role: 'user',
                    content: lastUserContent,
                    timestamp: Date.now()
                });
            }
            this.resetVisibleWindowToLatest();
            this.scrollToBottom();
            this.saveMessages();
            this.requestReply();
        },

        toggleTools() {
            this.showTools = !this.showTools;
            if (this.showTools) {
                this.closeEmojiPanel();
            }
        },

        toggleEmojiPanel() {
            this.showTools = false;
            this.showEmojiPanel = true;
            this.showEmojiUrlInput = false;
            this.showEmojiAddSheet = false;
            this.showEmojiPopover = false;
            this.emojiMoveMode = false;
            this.emojiUploadCategory = this.emojiCategory;
        },

        closeEmojiPanel() {
            this.showEmojiPanel = false;
            this.showEmojiUrlInput = false;
            this.showEmojiAddSheet = false;
            this.showEmojiPopover = false;
            this.isDraggingEmoji = false;
            this.dragIndex = -1;
            this.dragOverIndex = -1;
            this.dragCategory = '';
            this.emojiDragStart = null;
            this.emojiMoveMode = false;
            this.emojiMultiSelect = false;
            this.selectedEmojiKeys = new Set();
            this.cancelEmojiPress();
        },

        closeEmojiPopover() {
            this.showEmojiPopover = false;
            this.isDraggingEmoji = false;
            this.dragIndex = -1;
            this.dragOverIndex = -1;
            this.dragCategory = '';
            this.emojiDragStart = null;
            this.emojiActionTarget = null;
            this.emojiMoveMode = false;
        },

        openEmojiUrlInput() {
            this.showEmojiPanel = true;
            this.showEmojiUrlInput = true;
            this.showEmojiAddSheet = false;
        },

        openEmojiAddSheet() {
            this.showEmojiAddSheet = true;
            this.emojiUploadCategory = this.emojiCategory;
        },

        closeEmojiAddSheet() {
            this.showEmojiAddSheet = false;
        },

        triggerEmojiUpload() {
            this.showEmojiAddSheet = false;
            if (this.$refs.emojiFileInput) {
                this.$refs.emojiFileInput.click();
            }
        },

        normalizeEmojiName(rawName) {
            const name = String(rawName || '').trim();
            return name || `表情${Date.now().toString().slice(-4)}`;
        },

        ensureUniqueEmojiName(name) {
            const exists = new Set((this.getCategoryList(this.emojiUploadCategory) || []).map((e) => e.name));
            if (!exists.has(name)) return name;
            let index = 2;
            let next = `${name}${index}`;
            while (exists.has(next)) {
                index += 1;
                next = `${name}${index}`;
            }
            return next;
        },

        resolveEmojiCategory(emoji) {
            if (emoji?.category) return emoji.category;
            if ((this.commonEmojis || []).some((item) => item === emoji || item.id === emoji.id)) return 'common';
            if ((this.roleEmojis || []).some((item) => item === emoji || item.id === emoji.id)) return 'role';
            return 'mine';
        },

        getCategoryIndexList(category) {
            return this.displayedEmojis.filter((emoji) => this.resolveEmojiCategory(emoji) === category);
        },

        getEmojiIndexByKey(list, emoji) {
            const key = this.getEmojiKey(emoji);
            if (!key) return -1;
            return list.findIndex((item) => this.getEmojiKey(item) === key);
        },

        appendEmojiEntries(entries) {
            if (!entries.length) return;
            const currentList = this.getCategoryList(this.emojiUploadCategory);
            const nextList = [...(currentList || [])];
            entries.forEach((entry) => {
                const name = this.ensureUniqueEmojiName(this.normalizeEmojiName(entry.name));
                nextList.push({
                    id: `emoji_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                    name,
                    url: entry.url
                });
            });
            this.setCategoryList(this.emojiUploadCategory, nextList);
        },

        async handleEmojiFileChange(event) {
            const files = Array.from(event.target.files || []);
            if (!files.length) return;

            const readFile = (file) => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve({ file, url: reader.result });
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
            });

            const results = await Promise.all(files.map(readFile));
            const entries = results
                .filter(Boolean)
                .map((item) => {
                    const rawName = item.file?.name ? item.file.name.replace(/\.[^.]+$/, '') : '';
                    const suggested = rawName || '表情';
                    const nameInput = prompt('给表情取个名字：', suggested);
                    const name = nameInput ? nameInput.trim() : '';
                    if (!name) return null;
                    return {
                        name,
                        url: item.url
                    };
                })
                .filter(Boolean);

            this.appendEmojiEntries(entries);
            event.target.value = '';
        },

        addEmojiFromUrlText() {
            const text = String(this.emojiUrlText || '').trim();
            if (!text) return;

            const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
            const entries = [];
            const invalid = [];

            lines.forEach((line) => {
                const colonIndex = line.indexOf(':');
                const cnColonIndex = line.indexOf('：');
                let splitIndex = -1;
                if (colonIndex >= 0 && cnColonIndex >= 0) {
                    splitIndex = Math.min(colonIndex, cnColonIndex);
                } else {
                    splitIndex = colonIndex >= 0 ? colonIndex : cnColonIndex;
                }

                if (splitIndex <= 0) {
                    invalid.push(line);
                    return;
                }

                const name = line.slice(0, splitIndex).trim();
                const url = line.slice(splitIndex + 1).trim();
                if (!name || !url) {
                    invalid.push(line);
                    return;
                }
                entries.push({ name, url });
            });

            this.appendEmojiEntries(entries);
            this.emojiUrlText = '';
            this.showEmojiUrlInput = false;
            this.showEmojiAddSheet = false;

            if (invalid.length) {
                alert(`以下格式不正确，已跳过：\n${invalid.join('\n')}`);
            }
        },

        sendEmoji(name) {
            if (this.isLoading || !this.role) return;
            const token = `[${name}]`;

            requestAnimationFrame(() => {
                this.messages.push({
                    role: 'user',
                    content: token,
                    timestamp: Date.now()
                });

                this.resetVisibleWindowToLatest();
                this.scrollToBottom();

                requestAnimationFrame(() => {
                    this.saveMessages();
                });
            });

            this.closeEmojiPanel();
        },

        handleEmojiClick(emoji) {
            if (this.showEmojiPopover) {
                this.closeEmojiPopover();
                return;
            }
            if (this.emojiMoveMode) {
                return;
            }
            if (this.emojiMultiSelect) {
                this.toggleEmojiSelection(emoji);
                return;
            }
            if (this.emojiPressTriggered) {
                this.emojiPressTriggered = false;
                return;
            }
            this.sendEmoji(emoji.name);
        },

        handleEmojiPanelClick() {
            if (this.showEmojiPopover) {
                this.closeEmojiPopover();
                return;
            }
            if (this.emojiMoveMode) {
                this.emojiMoveMode = false;
                return;
            }
            if (this.emojiMultiSelect) {
                return;
            }
        },

        handleChatPageClick(event) {
            if (!this.showEmojiPanel && !this.showEmojiPopover) return;
            const panel = this.$el?.querySelector('.qq-emoji-panel');
            if (panel && panel.contains(event.target)) return;
            const tools = this.$el?.querySelector('.qq-chat-tools');
            if (tools && tools.contains(event.target)) return;
            if (this.showEmojiPanel) {
                this.closeEmojiPanel();
                return;
            }
            if (this.showEmojiPopover) {
                this.closeEmojiPopover();
            }
            this.emojiMoveMode = false;
        },

        startEmojiPress(event, emoji) {
            if (this.emojiMoveMode) {
                this.emojiDragStart = this.getEmojiPressPoint(event);
                this.dragCategory = this.resolveEmojiCategory(emoji);
                const categoryList = this.getCategoryIndexList(this.dragCategory);
                this.dragIndex = this.getEmojiIndexByKey(categoryList, emoji);
                this.dragOverIndex = this.dragIndex;
                return;
            }
            if (this.emojiMultiSelect) {
                return;
            }
            this.cancelEmojiPress();
            this.emojiPressTriggered = false;
            this.emojiPressStart = this.getEmojiPressPoint(event);
            this.emojiPressTargetEl = event?.currentTarget || null;
            this.emojiPressTargetEmoji = emoji || null;
            this.emojiPressStartTime = Date.now();
            this.emojiPressTimer = setTimeout(() => {
                this.emojiPressTriggered = true;
                this.openEmojiPopoverFromTarget();
            }, 420);
        },

        trackEmojiPressMove(event) {
            if (!this.emojiPressTimer || !this.emojiPressStart) return;
            const point = this.getEmojiPressPoint(event);
            if (!point) return;
            const dx = Math.abs(point.x - this.emojiPressStart.x);
            const dy = Math.abs(point.y - this.emojiPressStart.y);
            if (dx > 24 || dy > 24) {
                this.cancelEmojiPress();
            }
        },

        getEmojiPressPoint(event) {
            if (!event) return null;
            if (event.touches && event.touches[0]) {
                return { x: event.touches[0].clientX, y: event.touches[0].clientY };
            }
            if (event.clientX !== undefined && event.clientY !== undefined) {
                return { x: event.clientX, y: event.clientY };
            }
            return null;
        },

        cancelEmojiPress() {
            if (this.emojiPressTimer) {
                clearTimeout(this.emojiPressTimer);
                this.emojiPressTimer = null;
            }
            this.emojiPressStart = null;
            this.emojiPressTargetEl = null;
            this.emojiPressTargetEmoji = null;
            this.emojiPressStartTime = 0;
        },

        endEmojiPress() {
            if (!this.emojiPressStartTime) {
                this.cancelEmojiPress();
                return;
            }
            const elapsed = Date.now() - this.emojiPressStartTime;
            const shouldOpen = elapsed >= 420 && !this.emojiPressTriggered;
            if (this.emojiPressTimer) {
                clearTimeout(this.emojiPressTimer);
                this.emojiPressTimer = null;
            }
            if (shouldOpen) {
                this.emojiPressTriggered = true;
                this.openEmojiPopoverFromTarget();
            }
            this.emojiPressStart = null;
            this.emojiPressTargetEl = null;
            this.emojiPressTargetEmoji = null;
            this.emojiPressStartTime = 0;
        },

        openEmojiPopoverFromTarget() {
            const target = this.emojiPressTargetEl;
            const emoji = this.emojiPressTargetEmoji;
            if (!target) return;
            const rect = target.getBoundingClientRect();
            const panel = this.$el?.querySelector('.qq-emoji-panel');
            const panelRect = panel ? panel.getBoundingClientRect() : { left: 0, top: 0 };
            const containerRect = this.$el?.getBoundingClientRect() || { left: 0, top: 0 };
            const width = 170;
            const left = Math.max(8, rect.left - containerRect.left + rect.width / 2 - width / 2);
            const top = Math.max(
                panelRect.top - containerRect.top + 6,
                rect.top - containerRect.top - 52
            );
            this.emojiPopoverStyle = {
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`
            };
            this.emojiActionTarget = emoji;
            this.showEmojiPopover = true;
            this.dragCategory = this.resolveEmojiCategory(emoji);
            const categoryList = this.getCategoryIndexList(this.dragCategory);
            this.dragIndex = this.getEmojiIndexByKey(categoryList, emoji);
            this.dragOverIndex = this.dragIndex;
            this.isDraggingEmoji = false;
            this.emojiDragStart = this.emojiPressStart;
            this.emojiMoveMode = false;
        },

        renameEmoji() {
            const target = this.emojiActionTarget;
            if (!target) return;
            const nextName = prompt('重命名表情：', target.name || '');
            if (!nextName) return;
            const trimmed = nextName.trim();
            if (!trimmed) return;
            const category = this.resolveEmojiCategory(target);
            const nextList = this.getCategoryList(category).map((item) => {
                if (this.getEmojiKey(item) === this.getEmojiKey(target)) {
                    return { ...item, name: trimmed };
                }
                return item;
            });
            this.setCategoryList(category, nextList);
            this.closeEmojiPopover();
        },

        deleteEmoji() {
            const target = this.emojiActionTarget;
            if (!target) return;
            if (!confirm('删除这个表情吗？')) return;
            const category = this.resolveEmojiCategory(target);
            const nextList = this.getCategoryList(category).filter((item) => {
                return this.getEmojiKey(item) !== this.getEmojiKey(target);
            });
            this.setCategoryList(category, nextList);
            this.closeEmojiPopover();
        },

        handleEmojiDragMove(event) {
            if (!this.emojiMoveMode) return;
            const point = this.getEmojiPressPoint(event);
            if (!point) return;
            if (!this.emojiDragStart) {
                this.emojiDragStart = point;
            }
            const dx = Math.abs(point.x - this.emojiDragStart.x);
            const dy = Math.abs(point.y - this.emojiDragStart.y);
            if (!this.isDraggingEmoji && (dx > 12 || dy > 12)) {
                this.isDraggingEmoji = true;
            }
            if (!this.isDraggingEmoji) return;

            const target = document.elementFromPoint(point.x, point.y);
            const item = target ? target.closest('.qq-emoji-item[data-emoji-index]') : null;
            if (!item) return;
            const index = parseInt(item.dataset.emojiIndex, 10);
            if (!Number.isNaN(index)) {
                const emoji = this.displayedEmojis[index];
                if (!emoji) return;
                const category = this.resolveEmojiCategory(emoji);
                if (category !== this.dragCategory) return;
                const categoryList = this.getCategoryIndexList(this.dragCategory);
                const overIndex = this.getEmojiIndexByKey(categoryList, emoji);
                if (overIndex >= 0) {
                    this.dragOverIndex = overIndex;
                }
            }
        },

        endEmojiDrag() {
            if (!this.emojiMoveMode) return;
            if (!this.isDraggingEmoji) return;
            if (this.dragIndex >= 0 && this.dragOverIndex >= 0 && this.dragOverIndex !== this.dragIndex) {
                const nextList = [...this.getCategoryList(this.dragCategory)];
                const [moved] = nextList.splice(this.dragIndex, 1);
                nextList.splice(this.dragOverIndex, 0, moved);
                this.setCategoryList(this.dragCategory, nextList);
            }
            this.isDraggingEmoji = false;
            this.dragIndex = -1;
            this.dragOverIndex = -1;
            this.dragCategory = '';
            this.emojiDragStart = null;
        },

        enterEmojiMoveMode() {
            if (!this.emojiActionTarget) return;
            this.emojiMoveMode = true;
            this.showEmojiPopover = false;
            this.isDraggingEmoji = false;
            this.dragCategory = this.resolveEmojiCategory(this.emojiActionTarget);
            const categoryList = this.getCategoryIndexList(this.dragCategory);
            this.dragIndex = this.getEmojiIndexByKey(categoryList, this.emojiActionTarget);
            this.dragOverIndex = this.dragIndex;
            this.emojiDragStart = null;
        },

        enterEmojiMultiSelect() {
            this.emojiMultiSelect = true;
            this.emojiMoveMode = false;
            this.showEmojiPopover = false;
            this.selectedEmojiKeys = new Set();
        },

        selectAllEmojis() {
            const next = new Set();
            this.displayedEmojis.forEach((emoji) => {
                const key = this.getEmojiKey(emoji);
                if (key) next.add(key);
            });
            this.selectedEmojiKeys = next;
        },

        deleteSelectedEmojis() {
            if (this.selectedEmojiKeys.size === 0) return;
            if (!confirm('删除选中的表情吗？')) return;
            const buckets = {
                mine: [],
                common: [],
                role: []
            };
            this.displayedEmojis.forEach((emoji) => {
                if (!this.selectedEmojiKeys.has(this.getEmojiKey(emoji))) return;
                const category = this.resolveEmojiCategory(emoji);
                buckets[category].push(this.getEmojiKey(emoji));
            });

            if (buckets.mine.length) {
                const nextMine = this.getCategoryList('mine').filter((emoji) => {
                    return !buckets.mine.includes(this.getEmojiKey(emoji));
                });
                this.setCategoryList('mine', nextMine);
            }
            if (buckets.common.length) {
                const nextCommon = this.getCategoryList('common').filter((emoji) => {
                    return !buckets.common.includes(this.getEmojiKey(emoji));
                });
                this.setCategoryList('common', nextCommon);
            }
            if (buckets.role.length) {
                const nextRole = this.getCategoryList('role').filter((emoji) => {
                    return !buckets.role.includes(this.getEmojiKey(emoji));
                });
                this.setCategoryList('role', nextRole);
            }

            this.selectedEmojiKeys = new Set();
        },

        exitEmojiMultiSelect() {
            this.emojiMultiSelect = false;
            this.selectedEmojiKeys = new Set();
        },

        getEmojiKey(emoji) {
            if (!emoji) return '';
            const category = this.resolveEmojiCategory(emoji);
            const base = emoji.id || emoji.name || '';
            return base ? `${category}:${base}` : '';
        },

        isEmojiSelected(emoji) {
            return this.selectedEmojiKeys.has(this.getEmojiKey(emoji));
        },

        toggleEmojiSelection(emoji) {
            const key = this.getEmojiKey(emoji);
            if (!key) return;
            const next = new Set(this.selectedEmojiKeys);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            this.selectedEmojiKeys = next;
        },

        startLongPress(index) {
            if (this.longPressTimer) clearTimeout(this.longPressTimer);
            this.longPressTimer = setTimeout(() => {
                this.openMessageActions(index);
            }, 450);
        },

        cancelLongPress() {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        },

        openMessageActions(index) {
            this.cancelLongPress();
            this.activeMessageIndex = this.messageWindowOffset + index;
            this.showMessageActions = true;
        },

        closeMessageActions() {
            this.showMessageActions = false;
            this.activeMessageIndex = null;
        },

        editMessage() {
            const index = this.activeMessageIndex;
            if (index === null || index === undefined) return;
            const msg = this.messages[index];
            const original = msg.content || '';
            
            // 如果是转账消息，提示无法直接编辑文本，或者提供转换为文本的选项
            if (msg.type === 'transfer') {
                if (!confirm('这是一条转账消息，编辑将将其转换为普通文本，确定吗？')) {
                    return;
                }
            }

            const next = prompt('编辑消息（输入 "/transfer 金额 备注" 可转换为转账）：', original);
            if (next === null) {
                this.closeMessageActions();
                return;
            }
            const trimmed = next.trim();
            if (!trimmed) {
                this.closeMessageActions();
                return;
            }

            // 检查是否为转账指令 /transfer 100 备注
            const transferMatch = trimmed.match(/^\/transfer\s+(\d+(?:\.\d+)?)(?:\s+(.*))?$/i);
            if (transferMatch) {
                const amount = parseFloat(transferMatch[1]);
                const note = transferMatch[2] || '';
                this.messages[index] = {
                    ...msg,
                    type: 'transfer',
                    status: 'pending',
                    amount: amount,
                    note: note,
                    content: note ? `转账 ¥${amount.toFixed(2)}，备注：${note}` : `转账 ¥${amount.toFixed(2)}`
                };
            } else {
                // 普通文本
                this.messages[index] = {
                    ...msg,
                    type: undefined, // 清除转账类型
                    amount: undefined,
                    note: undefined,
                    content: trimmed
                };
            }

            this.saveMessages();
            this.closeMessageActions();
        },

        deleteMessage() {
            const index = this.activeMessageIndex;
            if (index === null || index === undefined) return;
            if (!confirm('确定要删除这条消息吗？')) return;
            this.messages.splice(index, 1);
            this.recomputeVisibleMessages();
            this.saveMessages();
            this.closeMessageActions();
        },

        splitAssistantMessages(text) {
            return text
                .split(/\r?\n+/)
                .map((line) => line.trim())
                .filter(Boolean);
        },

        buildProviderConfig(settings) {
            if (!settings) return null;
            return {
                baseUrl: settings.baseUrl,
                apiKey: settings.apiKey,
                modelName: settings.modelName,
                temperature: settings.temperature,
                maxTokens: settings.maxTokens,
                providerLabel: settings.providerLabel || ''
            };
        },

        shouldRetry(error) {
            if (!error) return false;
            if (error.code === 'PARSE_ERROR' || error.name === 'ParseError') return true;
            if (error.code === 'NETWORK_ERROR') return true;
            if (/Failed to fetch/i.test(error.message || '')) return true;
            return false;
        },

        friendlyErrorMessage(error) {
            if (!error) return '请求失败，请检查 API 设置';
            if (error.code === 'NETWORK_ERROR' || /Failed to fetch/i.test(error.message || '')) {
                return '网络失败，请检查 Base URL、网络连接或跨域限制';
            }
            if (error.code === 'TIMEOUT') {
                return '请求超时，请稍后重试或降低负载';
            }
            if (error.code === 'REQUEST_BUILD_ERROR' || error.name === 'RequestBuildError') {
                return error.message || '请求构造错误（messages 不是数组）';
            }
            if (error.code === 'BLOCKED' || error.status === 403 || error.status === 451) {
                return '请求被拦截，请检查访问权限或代理设置';
            }
            if (error.code === 'PARSE_ERROR' || error.name === 'ParseError') {
                return '解析失败，请检查模型返回结构或切换通道';
            }
            if (error.code === 'EMPTY_TRUNCATED') {
                return '空内容/被截断，请缩短输入或更换模型';
            }
            if (error.code === 'EMPTY_CONTENT') {
                return '空内容/被截断/被过滤，请检查输入内容或接口返回';
            }
            if (error.code === 'SAFETY_FILTER') {
                return '内容被安全过滤，请调整输入内容';
            }
            return error.message ? `请求失败：${error.message}` : '请求失败，请检查 API 设置';
        },

        shouldStoreAssistantError(error) {
            if (!error) return true;
            if (error.code === 'EMPTY_TRUNCATED' || error.code === 'EMPTY_CONTENT') return false;
            if (error.finishReason === 'length' && error.textTokens === 0) return false;
            return true;
        },

        buildDiagnostics(error) {
            if (!error) return '';
            const payload = {
                message: error.message || '',
                code: error.code || '',
                status: error.status || '',
                provider: error.provider || '',
                model: error.model || '',
                requestId: error.requestId || '',
                durationMs: error.durationMs || '',
                responseTextPreview: error.responseTextPreview || '',
                requestBodyPreview: error.requestBodyPreview || '',
                url: error.url || ''
            };
            return JSON.stringify(payload, null, 2);
        },

        buildRequestBodyPreview(config, messages) {
            const requestBody = {
                model: config?.modelName,
                messages,
                temperature: parseFloat(config?.temperature) || 0.7,
                max_tokens: parseInt(config?.maxTokens) || 8192,
                stream: false
            };
            try {
                return JSON.stringify(requestBody).slice(0, 800);
            } catch (e) {
                try {
                    return String(requestBody).slice(0, 800);
                } catch (err) {
                    return '';
                }
            }
        },

        async copyDiagnostics() {
            if (!this.replyErrorDiagnostics) return;
            try {
                await navigator.clipboard.writeText(this.replyErrorDiagnostics);
                this.replyErrorCopyText = '已复制';
                setTimeout(() => {
                    this.replyErrorCopyText = '复制诊断信息';
                }, 1500);
            } catch (e) {
                alert('复制失败，请手动选择诊断信息');
            }
        },

        async copyRequestBodyPreview() {
            if (!this.replyErrorRequestBodyPreview) return;
            try {
                await navigator.clipboard.writeText(this.replyErrorRequestBodyPreview);
                this.replyErrorRequestBodyCopyText = '已复制';
                setTimeout(() => {
                    this.replyErrorRequestBodyCopyText = '复制请求体预览';
                }, 1500);
            } catch (e) {
                alert('复制失败，请手动选择请求体预览');
            }
        },

        async attemptCallLLM(config, messages) {
            const result = await callLLM({
                baseUrl: config.baseUrl,
                apiKey: config.apiKey,
                model: config.modelName,
                temperature: config.temperature,
                maxTokens: config.maxTokens,
                messages,
                providerLabel: config.providerLabel
            });
            return result;
        },

        // 手动触发 AI 回复
        async requestReply() {
            if (this.isLoading || !this.role || !this.messages.length) return;

            // 检查 API 设置
            const apiSettings = this.getApiSettings();
            if (!apiSettings || !apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.modelName) {
                this.showApiWarning = true;
                return;
            }

            this.isLoading = true;
            this.showReplyError = false;
            this.replyErrorMessage = '';
            this.replyErrorDiagnostics = '';
            this.replyErrorCopyText = '复制诊断信息';
            this.replyErrorRequestBodyPreview = '';
            this.replyErrorRequestBodyCopyText = '复制请求体预览';
            this.lastRequestBodyPreview = '';

            try {
                const systemPrompt = this.buildSystemPrompt();
                const apiMessages = [
                    { role: 'system', content: systemPrompt },
                    ...this.messages.map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                ];

                const primaryConfig = this.buildProviderConfig(apiSettings);
                this.lastRequestBodyPreview = this.buildRequestBodyPreview(primaryConfig, apiMessages);
                let result = null;
                let lastError = null;

                try {
                    result = await this.attemptCallLLM(primaryConfig, apiMessages);
                } catch (error) {
                    lastError = error;
                    if (this.shouldRetry(error)) {
                        try {
                            result = await this.attemptCallLLM(primaryConfig, apiMessages);
                        } catch (retryError) {
                            lastError = retryError;
                        }
                    }
                }

                if (!result) {
                    throw lastError || new Error('模型返回内容为空');
                }

                const responseText = result.text || '';
                if (responseText && responseText.trim()) {
                    const replies = this.splitAssistantMessages(responseText.trim());
                    const finalReplies = replies.length ? replies : [responseText.trim()];
                    
                    // 处理转账相关的指令
                    let processedReplies = [];
                    let actionTaken = false;

                    finalReplies.forEach((text) => {
                        let content = text;
                        
                        // 1. 检查是否有收款/退还指令
                        if (content.includes('[收款]') || content.includes('[CONFIRM_RECEIPT]')) {
                            const receiptMsg = this.processTransferAction('received');
                            if (receiptMsg) {
                                processedReplies.push(receiptMsg);
                            }
                            content = content.replace(/\[收款\]|\[CONFIRM_RECEIPT\]/g, '').trim();
                        } else if (content.includes('[退还]') || content.includes('[REFUND]')) {
                            const refundMsg = this.processTransferAction('refunded');
                            if (refundMsg) {
                                processedReplies.push(refundMsg);
                            }
                            content = content.replace(/\[退还\]|\[REFUND\]/g, '').trim();
                        }

                        // 2. 检查是否有发起转账指令 [TRANSFER:amount:note]
                        const transferRegex = /\[TRANSFER:(\d+(?:\.\d+)?)(?::([^\]]*))?\]/i;
                        const match = content.match(transferRegex);
                        
                        if (match) {
                            const amount = parseFloat(match[1]);
                            const note = match[2] || '';
                            // 移除指令部分作为文本显示（或者完全替换）
                            // 这里选择将整条消息转为转账消息
                            processedReplies.push({
                                role: 'assistant',
                                type: 'transfer',
                                status: 'pending',
                                amount: amount,
                                note: note,
                                content: note ? `转账 ¥${amount.toFixed(2)}，备注：${note}` : `转账 ¥${amount.toFixed(2)}`,
                                timestamp: Date.now()
                            });
                        } else {
                            if (content) {
                                processedReplies.push({
                                    role: 'assistant',
                                    content: content,
                                    timestamp: Date.now()
                                });
                            }
                        }
                    });

                    processedReplies.forEach((msg, index) => {
                        this.messages.push({
                            ...msg,
                            timestamp: Date.now() + index
                        });
                    });

                    this.resetVisibleWindowToLatest();
                    this.saveMessages();
                    this.scrollToBottom();
                } else {
                    throw new Error('模型返回内容为空，请检查世界书/提示词是否过长或接口返回格式');
                }
            } catch (error) {
                console.error('API 调用失败:', error);
                const friendlyMessage = this.friendlyErrorMessage(error);
                this.replyErrorMessage = friendlyMessage;
                this.replyErrorDiagnostics = this.buildDiagnostics(error);
                this.replyErrorRequestBodyPreview = error?.requestBodyPreview || this.lastRequestBodyPreview || '';
                this.replyErrorRequestBodyCopyText = '复制请求体预览';
                this.showReplyError = true;
                if (this.shouldStoreAssistantError(error)) {
                    this.messages.push({
                        role: 'assistant',
                        content: `[错误] ${friendlyMessage}`,
                        timestamp: Date.now()
                    });
                    this.resetVisibleWindowToLatest();
                    this.saveMessages();
                    this.scrollToBottom();
                }
            } finally {
                this.isLoading = false;
            }
        },

        // 设置键盘弹出处理 - 使用 visualViewport 监听视口变化
        setupKeyboardHandler() {
            const chatPage = this.$el;
            if (!chatPage) return;
            
            // 保存初始高度
            this.initialHeight = window.innerHeight;
            
            // 使用 visualViewport API 监听键盘弹出
            if (window.visualViewport) {
                this.viewportResizeHandler = () => {
                    const viewport = window.visualViewport;
                    const keyboardHeight = this.initialHeight - viewport.height;

                    if (keyboardHeight > 100) {
                        // 键盘弹出 - 调整页面高度（让输入栏跟随上移），但不要动消息滚动位置
                        chatPage.style.height = `${viewport.height}px`;
                    } else {
                        // 键盘收起 - 恢复高度
                        chatPage.style.height = '100%';
                    }
                };
                
                window.visualViewport.addEventListener('resize', this.viewportResizeHandler);
            }
            
            // 输入框聚焦：保持当前消息列表/壁纸位置不变（不自动滚动）
            const input = this.$el?.querySelector('.qq-chat-input');
            if (input) {
                this.inputFocusHandler = () => {
                    // iOS/Android 在 focus 时可能会自动把可滚动容器滚到末尾
                    // 这里主动恢复到 focus 前的位置，避免“跳到最后一条消息”
                    const chatBody = this.$refs.chatBody;
                    if (!chatBody) return;

                    const prevTop = chatBody.scrollTop;
                    requestAnimationFrame(() => {
                        chatBody.scrollTop = prevTop;
                    });

                    // 某些机型会在 keyboard resize 后再次调整滚动，补一次
                    setTimeout(() => {
                        chatBody.scrollTop = prevTop;
                    }, 80);
                };
                input.addEventListener('focus', this.inputFocusHandler);
            }
        },
        
        // 移除键盘处理
        removeKeyboardHandler() {
            if (window.visualViewport && this.viewportResizeHandler) {
                window.visualViewport.removeEventListener('resize', this.viewportResizeHandler);
            }
            
            const input = this.$el?.querySelector('.qq-chat-input');
            if (input && this.inputFocusHandler) {
                input.removeEventListener('focus', this.inputFocusHandler);
            }
            
            // 恢复高度
            const chatPage = this.$el;
            if (chatPage) {
                chatPage.style.height = '100%';
            }
        },

        // 调用 API 逻辑已统一到 callLLM
        // 只保留有限条消息用于渲染，避免超长记录导致打开/点击卡顿
        recomputeVisibleMessages() {
            const limit = this.messageWindowLimit;
            const total = this.messages.length;
            const end = Math.min(Math.max(this.messageWindowEnd, 0), total);
            const maxOffset = Math.max(0, end - limit);
            const start = Math.min(Math.max(this.messageWindowOffset, 0), maxOffset);

            this.messageWindowOffset = start;
            this.messageWindowEnd = end;
            this.visibleMessages = this.messages.slice(start, end);
        },

        // 将窗口重置到最新一屏
        resetVisibleWindowToLatest() {
            const limit = this.messageWindowLimit;
            const total = this.messages.length;
            this.messageWindowEnd = total;
            this.messageWindowOffset = Math.max(0, total - limit);
            this.recomputeVisibleMessages();
        },

        // 上滑加载更多：渐进式加载（每次只加载少量消息，避免卡顿）
        loadMoreMessages() {
            if (this.loadingMore) return;
            if (this.messageWindowOffset <= 0) return;
            const chatBody = this.$refs.chatBody;
            if (!chatBody) return;

            this.loadingMore = true;
            const prevHeight = chatBody.scrollHeight;
            const prevTop = chatBody.scrollTop;

            // 使用 loadMoreCount 进行渐进式加载，而不是一次加载整个 messageWindowLimit
            const loadCount = Math.min(this.loadMoreCount, this.messageWindowOffset);
            this.messageWindowOffset = Math.max(0, this.messageWindowOffset - loadCount);
            this.recomputeVisibleMessages();

            this.$nextTick(() => {
                const newHeight = chatBody.scrollHeight;
                // 保持当前可见内容位置，避免跳动
                chatBody.scrollTop = newHeight - (prevHeight - prevTop);
                this.loadingMore = false;
            });
        },

        // 滚动处理（简化版，直接检测是否需要加载更多）
        handleScroll() {
            const chatBody = this.$refs.chatBody;
            if (!chatBody) return;
            
            // 接近顶部时加载更多历史消息
            if (chatBody.scrollTop < this.preloadThreshold) {
                this.loadMoreMessages();
            }
        },

        // 处理 AI 的收款/退款指令
        processTransferAction(action) {
            // 从后往前找最近一条用户发的、pending 状态的转账
            for (let i = this.messages.length - 1; i >= 0; i--) {
                const msg = this.messages[i];
                if (
                    msg.role === 'user'
                    && msg.type === 'transfer'
                    && (!msg.status || msg.status === 'pending')
                    && msg.resolution !== 'received'
                    && msg.resolution !== 'refunded'
                ) {
                    msg.resolution = action;
                    const receiverRole = msg.role === 'assistant' ? 'user' : 'assistant';
                    return this.buildTransferResponseMessage(msg, action, receiverRole);
                }
            }
            return null;
        }
    },
    mounted() {
        // 先让页面框架渲染出来（顶部栏、输入框），给用户即时反馈
        this.setupKeyboardHandler();
        this.applyBubbleCss();
        
        // 延迟一帧再加载消息和渲染消息列表，避免页面切换时卡顿
        requestAnimationFrame(() => {
            this.loadMessages();
            this.pageReady = true;
            
            this.$nextTick(() => {
                const chatBody = this.$refs.chatBody;
                if (chatBody) {
                    // 使用节流处理滚动事件（比防抖更及时，避免快速滑动时消息消失）
                    this.chatScrollHandler = () => {
                        this.handleScroll();
                    };
                    chatBody.addEventListener('scroll', this.chatScrollHandler, { passive: true });
                }
            });
        });
    },
    beforeUnmount() {
        this.removeKeyboardHandler();
        const styleTag = document.getElementById(this.bubbleStyleTagId);
        if (styleTag) styleTag.remove();

        const chatBody = this.$refs.chatBody;
        if (chatBody && this.chatScrollHandler) {
            chatBody.removeEventListener('scroll', this.chatScrollHandler);
        }
    }
};
