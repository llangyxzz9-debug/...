// QQ 聊天设置页面（原型）
export const QQChatSettingsPage = {
    template: `
        <div class="qq-chat-settings-page">
            <div class="qq-header">
                <div class="qq-header-left" @click="onBack && onBack()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </div>
                <div class="qq-title">聊天设置</div>
                <div class="qq-header-actions">
                    <button class="qq-header-save" @click="saveAll">保存</button>
                </div>
            </div>

            <div class="qq-chat-settings-body">
                <div class="qq-chat-settings-card">
                    <div
                        class="qq-chat-settings-avatar clickable"
                        :style="{ backgroundImage: 'url(' + (role?.avatar || defaultAvatar) + ')' }"
                        @click="openAvatarPicker"
                        title="点击上传头像"
                    ></div>
                    <div class="qq-chat-settings-meta">
                        <div class="qq-chat-settings-name">{{ role?.name || '未选择角色' }}</div>
                    </div>
                </div>

                <div class="qq-setting-group">
                    <div class="qq-setting-item">
                        <div class="qq-setting-label">聊天壁纸</div>
                        <div class="qq-setting-actions">
                            <button class="qq-setting-btn" @click="onUploadChatWallpaper && onUploadChatWallpaper()">上传壁纸</button>
                            <!-- 有壁纸后，清除键颜色与上传键一致；无壁纸时保持 secondary -->
                            <button
                                class="qq-setting-btn"
                                :class="{ secondary: !role?.chatWallpaper }"
                                @click="clearChatWallpaper"
                                :disabled="!role?.chatWallpaper"
                            >清除</button>
                        </div>
                    </div>
                </div>

                <div class="qq-setting-group">
                    <div class="qq-setting-item column">
                        <div class="qq-setting-label">自定义气泡 CSS（高级）</div>
                        <textarea
                            class="qq-setting-textarea"
                            v-model="bubbleCss"
                            @input="updatePreviewStyle"
                            placeholder=".qq-bubble.me { background: #4cd964; color: #fff; }&#10;.qq-bubble.ai { background: rgba(255,255,255,.9); }"
                        ></textarea>
                        <div class="qq-bubble-preview">
                            <div class="qq-message-row ai">
                                <div class="qq-msg-avatar" :style="{ backgroundImage: 'url(' + defaultAvatar + ')' }"></div>
                                <div class="qq-bubble ai">
                                    <div class="qq-bubble-content">这是 AI 的示例气泡。</div>
                                </div>
                            </div>
                            <div class="qq-message-row me">
                                <div class="qq-msg-avatar me" :style="{ backgroundImage: 'url(' + userAvatar + ')' }"></div>
                                <div class="qq-bubble me">
                                    <div class="qq-bubble-content">这是我的示例气泡。</div>
                                </div>
                            </div>
                        </div>

                        <div class="qq-bubble-tools">
                            <input
                                class="qq-preset-name-input"
                                v-model="presetName"
                                placeholder="样式名称（可选）"
                            />
                            <div class="qq-setting-actions">
                                <button class="qq-setting-btn" @click="applyBubbleCssNow">应用到聊天</button>
                                <button class="qq-setting-btn secondary" @click="savePreset">保存样式</button>
                            </div>
                        </div>

                        <div v-if="bubblePresets.length" class="qq-preset-list">
                            <div v-for="preset in bubblePresets" :key="preset.id" class="qq-preset-item">
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

                <div class="qq-setting-group">
                    <div class="qq-setting-item column">
                        <div class="qq-setting-label">我的人设</div>
                        <textarea
                            class="qq-setting-textarea"
                            v-model="myPersona"
                            placeholder="例如：我是一个在校大学生，说话简短，喜欢用类比解释问题..."
                        ></textarea>
                    </div>

                    <div class="qq-setting-item column">
                        <div class="qq-setting-label">对方人设</div>
                        <textarea
                            class="qq-setting-textarea"
                            v-model="aiPersona"
                            placeholder="例如：你是一个毒舌但真诚的朋友，擅长给行动建议..."
                        ></textarea>
                    </div>
                </div>

                <div class="qq-setting-group">
                    <div class="qq-setting-item column">
                        <div class="qq-setting-label">绑定世界书</div>
                        <div class="qq-setting-hint">可勾选多个世界书，和当前角色绑定后会自动用于提示词</div>
                        <div class="worldbook-bind-list" v-if="worldBooks && worldBooks.length">
                            <label
                                class="worldbook-bind-item"
                                v-for="book in worldBooks"
                                :key="book.id"
                            >
                                <input
                                    type="checkbox"
                                    :checked="selectedWorldBookIds.includes(book.id)"
                                    @change="toggleWorldBook(book.id)"
                                />
                                <span class="worldbook-bind-name">{{ book.name || '未命名世界书' }}</span>
                                <span class="worldbook-bind-meta">{{ getWorldBookMeta(book) }}</span>
                            </label>
                        </div>
                        <div v-else class="worldbook-bind-empty">
                            还没有世界书，请先在主页创建
                        </div>
                    </div>
                </div>

                <!-- 清空聊天记录按钮 -->
                <div class="qq-setting-group qq-danger-zone">
                    <div class="qq-setting-item">
                        <div class="qq-setting-label">清空聊天记录</div>
                        <div class="qq-setting-actions">
                            <button class="qq-setting-btn danger" @click="clearMessages">清空记录</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 头像上传弹窗：简洁可爱风格 -->
            <div v-if="avatarPickerOpen" class="qq-avatar-modal-mask" @click.self="closeAvatarPicker">
                <div class="qq-avatar-modal">
                    <div class="qq-avatar-modal-btns">
                        <button class="qq-avatar-btn local" @click="chooseLocalAvatar">本地上传</button>
                    </div>
                    
                    <div class="qq-avatar-modal-divider">
                        <span>或者</span>
                    </div>
                    
                    <div class="qq-avatar-url-row">
                        <input 
                            class="qq-avatar-url-input" 
                            v-model="avatarUrlInput" 
                            placeholder="粘贴图片链接..." 
                            @keyup.enter="confirmAvatarUrl"
                        />
                        <button class="qq-avatar-url-confirm" @click="confirmAvatarUrl">✓</button>
                    </div>
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
        onUpdateRole: Function,

        // 由 app.js 统一触发 fileInput
        onUploadAvatar: Function,
        onUploadChatWallpaper: Function,

        // 保存成功后跳转回聊天页（由 app.js 传入 backToQQChat）
        onAfterSave: Function
    },
    data() {
        return {
            // iOS风格默认头像
            defaultAvatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%23C7C7CC'/%3E%3Ccircle cx='30' cy='24' r='10' fill='%23fff'/%3E%3Cpath d='M30 36c-10 0-18 6-18 14v2h36v-2c0-8-8-14-18-14z' fill='%23fff'/%3E%3C/svg%3E",
            userAvatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%23007AFF'/%3E%3Ccircle cx='30' cy='24' r='10' fill='%23fff'/%3E%3Cpath d='M30 36c-10 0-18 6-18 14v2h36v-2c0-8-8-14-18-14z' fill='%23fff'/%3E%3C/svg%3E",
            bubbleCss: '',
            myPersona: '',
            aiPersona: '',
            selectedWorldBookIds: [],

            avatarPickerOpen: false,
            avatarUrlInput: '',

            presetName: '',
            bubblePresets: [],
            previewStyleTagId: 'qq-bubble-preview-style'
        };
    },
    watch: {
        role: {
            immediate: true,
            handler(r) {
                this.bubbleCss = (r && r.bubbleCss) || '';
                this.myPersona = (r && r.myPersona) || '';
                // 兼容旧字段 aiPersona，同时优先使用对方人设字段 setting（来自创建角色时填写的“设定”）
                this.aiPersona = (r && (r.setting || r.aiPersona)) || '';
                this.selectedWorldBookIds = Array.isArray(r?.worldBookIds) ? [...r.worldBookIds] : [];
                this.updatePreviewStyle();
            }
        }
    },
    methods: {
        updatePreviewStyle() {
            const css = (this.bubbleCss || '').trim();
            const existing = document.getElementById(this.previewStyleTagId);

            if (!css) {
                if (existing) existing.remove();
                return;
            }

            const styleTag = existing || document.createElement('style');
            styleTag.id = this.previewStyleTagId;
            styleTag.textContent = css;
            if (!existing) document.head.appendChild(styleTag);
        },

        applyBubbleCssNow() {
            if (!this.onUpdateRole) return;
            this.onUpdateRole({ bubbleCss: this.bubbleCss || '' });
        },

        savePreset() {
            const css = (this.bubbleCss || '').trim();
            if (!css) {
                alert('请先输入气泡 CSS');
                return;
            }

            let name = (this.presetName || '').trim();
            if (!name) {
                const index = this.bubblePresets.length + 1;
                name = `样式 ${index}`;
            }

            const preset = {
                id: `bubble_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                name,
                css
            };
            this.bubblePresets = [preset, ...this.bubblePresets];
            this.savePresets();
            this.presetName = '';
        },

        previewPreset(preset) {
            this.bubbleCss = preset.css || '';
            this.presetName = preset.name || '';
            this.updatePreviewStyle();
        },

        applyPreset(preset) {
            this.previewPreset(preset);
            this.applyBubbleCssNow();
        },

        deletePreset(presetId) {
            this.bubblePresets = this.bubblePresets.filter(p => p.id !== presetId);
            this.savePresets();
        },

        loadPresets() {
            try {
                const saved = localStorage.getItem('qqBubblePresets');
                this.bubblePresets = saved ? JSON.parse(saved) : [];
            } catch (e) {
                console.error('加载气泡样式失败:', e);
                this.bubblePresets = [];
            }
        },

        savePresets() {
            try {
                localStorage.setItem('qqBubblePresets', JSON.stringify(this.bubblePresets));
            } catch (e) {
                console.error('保存气泡样式失败:', e);
            }
        },

        openAvatarPicker() {
            this.avatarPickerOpen = true;
            this.avatarUrlInput = '';
        },
        closeAvatarPicker() {
            this.avatarPickerOpen = false;
            this.avatarUrlInput = '';
        },
        chooseLocalAvatar() {
            this.closeAvatarPicker();
            if (this.onUploadAvatar) this.onUploadAvatar();
        },
        confirmAvatarUrl() {
            const url = (this.avatarUrlInput || '').trim();
            if (!url) return;
            if (!this.onUpdateRole) return;
            this.onUpdateRole({ avatar: url });
            this.closeAvatarPicker();
        },

        toggleWorldBook(bookId) {
            const current = new Set(this.selectedWorldBookIds || []);
            if (current.has(bookId)) {
                current.delete(bookId);
            } else {
                current.add(bookId);
            }
            this.selectedWorldBookIds = Array.from(current);
            if (this.onUpdateRole) {
                this.onUpdateRole({ worldBookIds: this.selectedWorldBookIds });
            }
        },

        getWorldBookMeta(book) {
            const groups = (book.groups || []).length;
            const entries = (book.groups || []).reduce((sum, g) => sum + (g.entries || []).length, 0);
            return `${groups}组·${entries}条`;
        },

        saveAll() {
            if (!this.onUpdateRole) return;
            this.onUpdateRole({
                bubbleCss: this.bubbleCss || '',
                myPersona: this.myPersona || '',
                // 保存时覆盖创建时填写的“设定”
                setting: this.aiPersona || '',
                worldBookIds: Array.isArray(this.selectedWorldBookIds) ? this.selectedWorldBookIds : []
            });

            // 这里视为“保存成功”（本地写入 localStorage 同步完成）后，自动跳回对话页
            if (this.onAfterSave) this.onAfterSave();
        },

        clearChatWallpaper() {
            if (!this.onUpdateRole) return;
            this.onUpdateRole({ chatWallpaper: null });
        },

        // 清空聊天记录
        clearMessages() {
            if (!this.role || !this.role.id) return;
            if (!confirm('确定要清空所有聊天记录吗？此操作不可恢复。')) return;
            try {
                const key = `chat_${this.role.id}`;
                localStorage.removeItem(key);
                alert('聊天记录已清空');
            } catch (e) {
                console.error('清空聊天记录失败:', e);
                alert('清空失败，请重试');
            }
        }
    },
    mounted() {
        this.loadPresets();
        this.updatePreviewStyle();
    },
    beforeUnmount() {
        const styleTag = document.getElementById(this.previewStyleTagId);
        if (styleTag) styleTag.remove();
    }
};
