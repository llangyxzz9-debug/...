// Main application entry
import { HomePage } from './components/HomePage.js';
import { SettingsPage } from './components/SettingsPage.js';
import { AppearancePage } from './components/AppearancePage.js';
import { FontSettingsPage } from './components/FontSettingsPage.js';
import { PresetPage } from './components/PresetPage.js';
import { QQApp } from './components/QQApp.js';
import { QQChatPage } from './components/QQChatPage.js';
import { QQCreateRolePage } from './components/QQCreateRolePage.js';
import { QQChatSettingsPage } from './components/QQChatSettingsPage.js';
import { WorldBookPage } from './components/WorldBookPage.js';
import { ForumPage } from './components/ForumPage.js';

const { createApp } = Vue;

// 全局消息缓存：避免重复解析 JSON
// key: roleId, value: { messages: [], timestamp: number }
window.chatMessagesCache = window.chatMessagesCache || {};

// Root component
const App = {
    template: `
        <div class="phone-case">
            <div class="screen" :class="{ 'has-wallpaper': wallpaperImage }">
                <div 
                    v-if="wallpaperImage" 
                    class="wallpaper-layer"
                    :style="{ backgroundImage: 'url(' + wallpaperImage + ')' }"
                ></div>
                
                <HomePage 
                    v-if="currentPage === 'home'"
                    ref="homePageRef"
                    :on-show-settings="showSettings"
                    :on-show-appearance="showAppearance"
                    :on-show-font-settings="showFontSettings"
                    :on-show-preset="showPreset"
                    :on-show-world-book="showWorldBook"
                    :on-show-forum="showForum"
                    :custom-icon="customIcon"
                    :app-icons="appIcons"
                    @upload="handleUpload"
                    @open-qq="openQQ"
                />

                <WorldBookPage
                    v-if="currentPage === 'worldBook'"
                    :on-back="goHome"
                    :world-books="worldBooks"
                    :on-update-world-books="updateWorldBooks"
                />

                <QQApp 
                    v-if="currentPage === 'qq'"
                    :on-back="goHome"
                    :on-open-chat="openQQChat"
                    :on-create-role="openQQCreateRole"
                    :on-import-card="importSillyTavernCard"
                    :on-delete-role="deleteQQRole"
                    :roles="qqRoles"
                    :messages-cache="chatMessagesCache"
                />

                <QQCreateRolePage
                    v-if="currentPage === 'qqCreateRole'"
                    :on-back="backToQQList"
                    :on-create="createQQRole"
                />

                <QQChatPage
                    v-if="currentPage === 'qqChat'"
                    :on-back="backToQQList"
                    :role="activeQQRole"
                    :world-books="worldBooks"
                    :on-open-chat-settings="openQQChatSettings"
                    :on-update-role="updateQQRole"
                    :messages-cache="chatMessagesCache"
                />

                <QQChatSettingsPage
                    v-if="currentPage === 'qqChatSettings'"
                    :on-back="backToQQChat"
                    :role="activeQQRole"
                    :world-books="worldBooks"
                    :on-update-role="updateQQRole"
                    :on-upload-avatar="triggerQQRoleAvatarUpload"
                    :on-upload-chat-wallpaper="triggerQQChatWallpaperUpload"
                    :on-after-save="backToQQChat"
                />
                
                <SettingsPage 
                    v-if="currentPage === 'settings'"
                    :on-back="goHome"
                />
                
                <AppearancePage 
                    v-if="currentPage === 'appearance'"
                    ref="appearancePageRef"
                    :on-back="goHome"
                    :on-wallpaper-upload="triggerWallpaperUpload"
                    :on-icon-upload="triggerIconUpload"
                    :current-wallpaper="wallpaperImage"
                    :current-icon="customIcon"
                    @clear-wallpaper="clearWallpaper"
                    @set-custom-icon="setCustomIcon"
                    @clear-custom-icon="clearCustomIcon"
                    @update-app-icons="handleAppIconsUpdate"
                />

                <FontSettingsPage
                    v-if="currentPage === 'fontSettings'"
                    :on-back="goHome"
                    @font-updated="applyFont"
                    @font-reset="resetFont"
                />

                <PresetPage
                    v-if="currentPage === 'preset'"
                    :on-back="goHome"
                />

                <ForumPage
                    v-if="currentPage === 'forum'"
                    :on-back="goHome"
                />
            </div>
        </div>
        
        <input 
            type="file" 
            ref="fileInput"
            class="file-input"
            accept="image/*"
            @change="handleFileChange"
        >
    `,
    
    components: {
        HomePage,
        SettingsPage,
        AppearancePage,
        FontSettingsPage,
        PresetPage,
        QQApp,
        QQChatPage,
        QQCreateRolePage,
        QQChatSettingsPage,
        WorldBookPage,
        ForumPage
    },
    
    data() {
        return {
            currentPage: 'home',
            currentUploadType: null,
            wallpaperImage: null,
            customIcon: null,
            appIcons: {},
            worldBooks: [],

            qqRoles: [],
            activeQQRole: null,
            currentUploadContext: null,
            chatMessagesCache: window.chatMessagesCache
        };
    },
    
    methods: {
        openQQ() {
            this.currentPage = 'qq';
        },

        backToQQList() {
            this.currentPage = 'qq';
        },

        openQQCreateRole() {
            this.currentPage = 'qqCreateRole';
        },

        createQQRole(role) {
            const roles = [...this.qqRoles, role];
            this.qqRoles = roles;
            try {
                localStorage.setItem('qqRoles', JSON.stringify(roles));
            } catch (e) {}
            this.currentPage = 'qq';
        },

        async importSillyTavernCard(file) {
            if (!file) throw new Error('未选择文件');

            const readAsText = (f) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsText(f);
            });

            const readAsArrayBuffer = (f) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsArrayBuffer(f);
            });

            const decodeBase64Json = (b64) => {
                try {
                    const binary = atob((b64 || '').replace(/\s+/g, ''));
                    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
                    const jsonText = new TextDecoder('utf-8').decode(bytes);
                    return JSON.parse(jsonText);
                } catch (e) {
                    return null;
                }
            };

            const parseKeywords = (value) => {
                if (Array.isArray(value)) {
                    return value.map((v) => String(v).trim()).filter(Boolean);
                }
                if (typeof value !== 'string') return [];
                return value
                    .split(/[;,\n]/)
                    .map((v) => v.trim())
                    .filter(Boolean);
            };

            const extractCardFromPng = async (f) => {
                const buffer = await readAsArrayBuffer(f);
                const view = new DataView(buffer);
                const decoder = new TextDecoder();

                const tryParseText = (text) => {
                    if (!text) return null;
                    const payload = text.includes('\0') ? text.split('\0').pop() : text;
                    const base64Match = payload.match(/(?:chara|json|card|data)=?([A-Za-z0-9+/=]{20,})/);
                    if (base64Match) {
                        const parsed = decodeBase64Json(base64Match[1]);
                        if (parsed) return parsed;
                    }
                    const looseBase64 = payload.match(/([A-Za-z0-9+/=]{50,})/);
                    if (looseBase64) {
                        const parsed = decodeBase64Json(looseBase64[1]);
                        if (parsed) return parsed;
                    }
                    const directJsonMatch = payload.match(/\{[\s\S]*\}/);
                    if (directJsonMatch) {
                        try {
                            return JSON.parse(directJsonMatch[0]);
                        } catch (e) {}
                    }
                    return null;
                };

                let offset = 8; // skip signature
                while (offset + 8 <= view.byteLength) {
                    const length = view.getUint32(offset);
                    const typeBytes = new Uint8Array(buffer, offset + 4, 4);
                    const type = Array.from(typeBytes).map((b) => String.fromCharCode(b)).join('');
                    const dataStart = offset + 8;
                    const dataEnd = dataStart + length;
                    if (dataEnd > view.byteLength) break;

                    if (type === 'tEXt' || type === 'iTXt' || type === 'zTXt') {
                        const rawText = decoder.decode(new Uint8Array(buffer, dataStart, length));
                        const parsed = tryParseText(rawText);
                        if (parsed) return parsed;
                    }

                    offset = dataEnd + 4; // skip CRC
                }
                return null;
            };

            const extractCardFromFile = async (f) => {
                const name = (f.name || '').toLowerCase();
                const type = (f.type || '').toLowerCase();
                if (name.endsWith('.json') || type.includes('json')) {
                    const text = await readAsText(f);
                    return JSON.parse(text);
                }
                if (name.endsWith('.png') || type.includes('png')) {
                    const pngCard = await extractCardFromPng(f);
                    if (pngCard) return pngCard;
                    const fallbackText = await readAsText(f);
                    try {
                        return JSON.parse(fallbackText);
                    } catch (e) {
                        throw new Error('未能从 PNG 中解析到角色卡');
                    }
                }
                throw new Error('仅支持 JSON 或 PNG 角色卡');
            };

            const buildSettingText = (data) => {
                const parts = [];
                const add = (label, value) => {
                    if (!value) return;
                    const text = String(value).trim();
                    if (!text) return;
                    parts.push(label ? `${label}：${text}` : text);
                };

                add('', data.description || data.desc || data.summary);
                add('性格', data.personality || data.traits || data.persona);
                add('场景', data.scenario || data.context || data.setting);
                add('开场白', data.first_mes || data.firstMessage || data.greeting);
                add('示例对话', data.mes_example || data.example_dialogue || data.examples);
                add('附加设定', data.additional_persona || data.additional_personality || data.notes);
                add('系统提示', data.system_prompt || data.system || data.jailbreak || data.prompt);
                add('创作者备注', data.creator_notes || data.notes_from_author);
                add('历史后提示', data.post_history_instructions);

                return parts.join('\n\n');
            };

            const extractWorldEntries = (raw) => {
                const infoSources = [
                    raw?.extensions?.world_info,
                    raw?.extensions?.worldinfo,
                    raw?.extensions?.wi,
                    raw?.extensions?.book,
                    raw?.extensions?.lore,
                    raw?.world_info,
                    raw?.character_book,
                    raw?.extensions?.character_book,
                    raw?.data?.character_book
                ];
                const source = infoSources.find((v) => v) || [];
                const rawEntries = source?.entries || source?.lorebook || source?.data || source;
                const list = Array.isArray(rawEntries) ? rawEntries : Object.values(rawEntries || {});

                const bookName =
                    source?.name ||
                    source?.book ||
                    raw?.worldBookName ||
                    raw?.lorebook?.name ||
                    raw?.lorebook?.settings?.name ||
                    raw?.lorebook?.label ||
                    raw?.extensions?.world_info?.name ||
                    raw?.extensions?.character_book?.name ||
                    '';

                const entries = list
                    .map((entry) => {
                        if (!entry) return null;
                        const content = (entry.content || entry.desc || entry.description || entry.text || '').trim();
                        const keywords = parseKeywords(
                            entry.keys ||
                            entry.key ||
                            entry.triggers ||
                            entry.activation_keys ||
                            entry.tag ||
                            entry.keywords ||
                            []
                        );
                        if (!content && !keywords.length) return null;
                        return {
                            id: `wbe_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                            name: (entry.name || entry.title || entry.comment || keywords[0] || '导入条目').trim(),
                            keywords,
                            keywordsText: keywords.join(', '),
                            content,
                            enabled: entry.enabled !== false && entry.disabled !== true,
                            always: !!(entry.constant || entry.always || entry.always_on)
                        };
                    })
                    .filter(Boolean);

                return { entries, bookName };
            };

            const normalizeCard = (card) => {
                if (!card) throw new Error('未能解析角色卡');
                const data = card.data || card.character || card.chara || card;
                const name = (data.name || card.name || '导入角色').trim() || '导入角色';
                const avatar = data.avatar || data.image || data.picture || card.avatar || '';
                const setting = buildSettingText(data) || (data.persona ? String(data.persona) : '');
                const { entries, bookName } = extractWorldEntries(data);
                const worldBook = entries.length
                    ? {
                        id: `wb_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                        name: (bookName && String(bookName).trim()) || `${name}的世界书`,
                        createdAt: Date.now(),
                        groups: [{
                            id: `wbg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                            name: '默认分组',
                            entries
                        }]
                    }
                    : null;

                return { name, avatar, setting, worldBook };
            };

            const cardJson = await extractCardFromFile(file);
            const parsed = normalizeCard(cardJson);
            const roleId = `role_${Date.now()}_${Math.random().toString(16).slice(2)}`;

            let nextWorldBooks = this.worldBooks || [];
            const worldBookIds = [];

            if (parsed.worldBook) {
                nextWorldBooks = [parsed.worldBook, ...nextWorldBooks];
                worldBookIds.push(parsed.worldBook.id);
                this.updateWorldBooks(nextWorldBooks);
            }

            const role = {
                id: roleId,
                name: parsed.name,
                setting: parsed.setting || '',
                aiPersona: parsed.setting || '',
                avatar: parsed.avatar || '',
                worldBookIds
            };

            const roles = [role, ...this.qqRoles];
            this.qqRoles = roles;
            try {
                localStorage.setItem('qqRoles', JSON.stringify(roles));
            } catch (e) {}

            return {
                roleName: role.name,
                worldBookCount: worldBookIds.length
            };
        },

        openQQChat(role) {
            this.activeQQRole = role;
            this.currentPage = 'qqChat';
        },

        backToQQChat() {
            this.currentPage = 'qqChat';
        },

        openQQChatSettings() {
            this.currentPage = 'qqChatSettings';
        },

        updateQQRole(patch) {
            if (!this.activeQQRole) return;

            const updatedRole = { ...this.activeQQRole, ...patch };
            this.activeQQRole = updatedRole;

            const roles = (this.qqRoles || []).map((r) => (r.id === updatedRole.id ? updatedRole : r));
            this.qqRoles = roles;

            try {
                localStorage.setItem('qqRoles', JSON.stringify(roles));
            } catch (e) {}
        },

        deleteQQRole(roleId) {
            this.qqRoles = this.qqRoles.filter(r => r.id !== roleId);
            try {
                localStorage.setItem('qqRoles', JSON.stringify(this.qqRoles));
            } catch (e) {}
        },

        showSettings() {
            this.currentPage = 'settings';
        },
        
        showAppearance() {
            this.currentPage = 'appearance';
        },

        showFontSettings() {
            this.currentPage = 'fontSettings';
        },

        showPreset() {
            this.currentPage = 'preset';
        },

        showWorldBook() {
            this.currentPage = 'worldBook';
        },

        showForum() {
            this.currentPage = 'forum';
        },
        
        goHome() {
            this.currentPage = 'home';
        },
        
        handleUpload(type) {
            this.currentUploadType = type;
            this.currentUploadContext = null;
            this.$refs.fileInput.click();
        },

        triggerQQRoleAvatarUpload() {
            this.currentUploadType = 'qqRoleAvatar';
            this.currentUploadContext = { roleId: this.activeQQRole?.id };
            this.$refs.fileInput.click();
        },

        triggerQQChatWallpaperUpload() {
            this.currentUploadType = 'qqChatWallpaper';
            this.currentUploadContext = { roleId: this.activeQQRole?.id };
            this.$refs.fileInput.click();
        },
        
        triggerWallpaperUpload() {
            this.currentUploadType = 'wallpaper';
            this.$refs.fileInput.click();
        },
        
        triggerIconUpload() {
            this.currentUploadType = 'customIcon';
            this.$refs.fileInput.click();
        },
        
        // 压缩图片到指定尺寸和质量
        compressImage(dataUrl, maxSize = 200, quality = 0.8) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    // 计算缩放比例
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = Math.round((height * maxSize) / width);
                            width = maxSize;
                        } else {
                            width = Math.round((width * maxSize) / height);
                            height = maxSize;
                        }
                    }
                    
                    // 创建 canvas 进行压缩
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    
                    // 使用高质量的图片缩放
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // 转换为 JPEG 格式（更小的文件大小）
                    const compressed = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressed);
                };
                img.onerror = () => {
                    // 如果压缩失败，返回原图
                    resolve(dataUrl);
                };
                img.src = dataUrl;
            });
        },

        async handleFileChange(event) {
            const file = event.target.files[0];
            if (file && this.currentUploadType) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    let dataUrl = e.target.result;
                    
                    // 对头像进行压缩（200x200，质量 0.8）
                    // 这样可以大幅减少渲染时的性能消耗
                    if (this.currentUploadType === 'qqRoleAvatar') {
                        dataUrl = await this.compressImage(dataUrl, 200, 0.8);
                    }
                    
                    switch (this.currentUploadType) {
                        case 'wallpaper':
                            this.wallpaperImage = dataUrl;
                            localStorage.setItem('wallpaperImage', dataUrl);
                            break;
                        case 'customIcon':
                            this.customIcon = dataUrl;
                            localStorage.setItem('customIcon', dataUrl);
                            if (this.$refs.appearancePageRef) {
                                this.$refs.appearancePageRef.setCustomIcon(dataUrl);
                            }
                            break;

                        case 'qqRoleAvatar': {
                            const roleId = this.currentUploadContext?.roleId;
                            if (roleId) this.updateQQRole({ avatar: dataUrl });
                            break;
                        }

                        case 'qqChatWallpaper': {
                            const roleId = this.currentUploadContext?.roleId;
                            if (roleId) this.updateQQRole({ chatWallpaper: dataUrl });
                            break;
                        }

                        default:
                            if (this.$refs.homePageRef) {
                                this.$refs.homePageRef.setImage(this.currentUploadType, dataUrl);
                            }
                            break;
                    }
                };
                reader.readAsDataURL(file);
            }
            event.target.value = '';
        },
        
        clearWallpaper() {
            this.wallpaperImage = null;
            localStorage.removeItem('wallpaperImage');
        },
        
        setCustomIcon(url) {
            this.customIcon = url;
            localStorage.setItem('customIcon', url);
        },
        
        clearCustomIcon() {
            this.customIcon = null;
            localStorage.removeItem('customIcon');
        },
        
        handleAppIconsUpdate(icons) {
            this.appIcons = icons;
        },

        updateWorldBooks(books) {
            this.worldBooks = Array.isArray(books) ? books : [];
            try {
                localStorage.setItem('worldBooks', JSON.stringify(this.worldBooks));
            } catch (e) {}
            this.pruneRoleWorldBooks();
        },

        pruneRoleWorldBooks() {
            const validIds = new Set((this.worldBooks || []).map(b => b.id));
            let changed = false;
            const roles = (this.qqRoles || []).map((role) => {
                const ids = Array.isArray(role.worldBookIds) ? role.worldBookIds : [];
                const nextIds = ids.filter(id => validIds.has(id));
                if (nextIds.length !== ids.length) {
                    changed = true;
                    return { ...role, worldBookIds: nextIds };
                }
                return role;
            });
            if (changed) {
                this.qqRoles = roles;
                try {
                    localStorage.setItem('qqRoles', JSON.stringify(roles));
                } catch (e) {}
            }
        },

        loadWorldBooks() {
            try {
                const saved = localStorage.getItem('worldBooks');
                if (saved) {
                    this.worldBooks = JSON.parse(saved) || [];
                }
            } catch (e) {
                this.worldBooks = [];
            }
        },
        
        loadSavedSettings() {
            const savedWallpaper = localStorage.getItem('wallpaperImage');
            if (savedWallpaper) {
                this.wallpaperImage = savedWallpaper;
            }

            const savedIcon = localStorage.getItem('customIcon');
            if (savedIcon) {
                this.customIcon = savedIcon;
            }
            
            const savedCss = localStorage.getItem('customCss');
            if (savedCss) {
                let styleTag = document.getElementById('custom-user-css');
                if (!styleTag) {
                    styleTag = document.createElement('style');
                    styleTag.id = 'custom-user-css';
                    document.head.appendChild(styleTag);
                }
                styleTag.textContent = savedCss;
            }

            const savedFontUrl = localStorage.getItem('customFontUrl');
            if (savedFontUrl) {
                this.applyFont(savedFontUrl);
            }
            
            this.loadAndApplyAppIcons();
        },
        
        loadAndApplyAppIcons() {
            try {
                const saved = localStorage.getItem('appCustomIcons');
                if (saved) {
                    this.appIcons = JSON.parse(saved);
                }
            } catch (e) {
                console.error('加载应用图标失败:', e);
            }
        },

        applyFont(url) {
            let styleTag = document.getElementById('custom-font-style');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'custom-font-style';
                document.head.appendChild(styleTag);
            }
            
            styleTag.textContent = `
                @font-face {
                    font-family: 'CustomFont';
                    src: url('${url}');
                    font-display: swap;
                }
                @font-face {
                    font-family: 'CustomFontPreview';
                    src: url('${url}');
                    font-display: swap;
                }
                body, button, input, textarea, select, .editable-text {
                    font-family: 'CustomFont', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                }
            `;
        },

        resetFont() {
            const styleTag = document.getElementById('custom-font-style');
            if (styleTag) {
                styleTag.remove();
            }
        }
    },
    
    mounted() {
        this.loadSavedSettings();
        this.loadWorldBooks();

        try {
            const saved = localStorage.getItem('qqRoles');
            if (saved) {
                const roles = JSON.parse(saved) || [];
                this.qqRoles = roles.map(r => ({
                    ...r,
                    worldBookIds: Array.isArray(r.worldBookIds) ? r.worldBookIds : []
                }));
            }
        } catch (e) {
            this.qqRoles = [];
        }

        this.pruneRoleWorldBooks();
    }
};

createApp(App).mount('#app');
