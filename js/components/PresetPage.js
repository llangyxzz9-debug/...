// 全局提示词预设页面
export const PresetPage = {
    template: `
        <div class="qq-preset-page">
            <div class="qq-header">
                <div class="qq-header-left" @click="onBack && onBack()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </div>
                <div class="qq-title">预设</div>
                <div class="qq-header-actions">
                    <button class="qq-header-save" @click="saveGlobalPrompt">保存</button>
                </div>
            </div>

            <div class="qq-preset-body">
                <div class="qq-setting-group">
                    <div class="qq-setting-item column">
                        <div class="qq-setting-label">全局对话提示词</div>
                        <textarea
                            class="qq-setting-textarea"
                            v-model="globalPrompt"
                            placeholder="默认提示词（模板）：
你是{角色名}。以下是你的人设：
{对方人设}

与你对话的用户的信息：
{我的人设}

请保持角色扮演，用自然、口语化的方式回复。回复不要太长，像正常聊天一样。
请将回复拆成多条短消息，每条消息单独一行，不要加序号或列表字符。
{世界书内容}"
                        ></textarea>
                        <div class="qq-setting-hint">此提示词对所有角色生效，会覆盖默认提示词。留空则使用默认提示词（包含人设/世界书信息）。</div>

                        <div class="qq-bubble-tools">
                            <input
                                class="qq-preset-name-input"
                                v-model="presetName"
                                placeholder="提示词名称（可选）"
                            />
                            <div class="qq-setting-actions">
                                <button class="qq-setting-btn" @click="applyGlobalPrompt">应用到聊天</button>
                                <button class="qq-setting-btn secondary" @click="savePreset">保存预设</button>
                                <button class="qq-setting-btn secondary" @click="resetGlobalPrompt">还原默认</button>
                            </div>
                        </div>

                        <div v-if="presets.length" class="qq-preset-list">
                            <div v-for="preset in presets" :key="preset.id" class="qq-preset-item">
                                <div class="qq-preset-name">{{ preset.name }}</div>
                                <div class="qq-setting-actions">
                                    <button class="qq-setting-btn" @click="previewPreset(preset)">预览</button>
                                    <button class="qq-setting-btn" @click="applyPreset(preset)">应用</button>
                                    <button class="qq-setting-btn secondary" @click="deletePreset(preset.id)">删除</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    props: {
        onBack: Function
    },
    data() {
        return {
            globalPrompt: '',
            presetName: '',
            presets: []
        };
    },
    methods: {
        applyGlobalPrompt() {
            this.saveGlobalPrompt();
        },

        saveGlobalPrompt() {
            try {
                localStorage.setItem('qqGlobalSystemPrompt', (this.globalPrompt || '').trim());
            } catch (e) {
                console.error('保存全局提示词失败:', e);
            }
        },

        resetGlobalPrompt() {
            this.globalPrompt = '';
            this.presetName = '';
            try {
                localStorage.setItem('qqGlobalSystemPrompt', '');
            } catch (e) {
                console.error('重置全局提示词失败:', e);
            }
        },

        savePreset() {
            const prompt = (this.globalPrompt || '').trim();
            if (!prompt) {
                alert('请先输入提示词');
                return;
            }

            let name = (this.presetName || '').trim();
            if (!name) {
                const index = this.presets.length + 1;
                name = `提示词 ${index}`;
            }

            const preset = {
                id: `prompt_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                name,
                content: prompt
            };
            this.presets = [preset, ...this.presets];
            this.savePresets();
            this.presetName = '';
        },

        previewPreset(preset) {
            this.globalPrompt = preset.content || '';
            this.presetName = preset.name || '';
        },

        applyPreset(preset) {
            this.previewPreset(preset);
            this.saveGlobalPrompt();
        },

        deletePreset(presetId) {
            this.presets = this.presets.filter(p => p.id !== presetId);
            this.savePresets();
        },

        loadPresets() {
            try {
                const saved = localStorage.getItem('qqGlobalPromptPresets');
                this.presets = saved ? JSON.parse(saved) : [];
            } catch (e) {
                console.error('加载提示词预设失败:', e);
                this.presets = [];
            }
        },

        savePresets() {
            try {
                localStorage.setItem('qqGlobalPromptPresets', JSON.stringify(this.presets));
            } catch (e) {
                console.error('保存提示词预设失败:', e);
            }
        },

        loadGlobalPrompt() {
            try {
                const saved = localStorage.getItem('qqGlobalSystemPrompt');
                this.globalPrompt = saved || '';
            } catch (e) {
                console.error('加载全局提示词失败:', e);
                this.globalPrompt = '';
            }
        }
    },
    mounted() {
        this.loadPresets();
        this.loadGlobalPrompt();
    }
};
