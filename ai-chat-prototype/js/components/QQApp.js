// QQ 应用组件
export const QQApp = {
    template: `
        <div class="qq-app">
            <!-- 顶部栏 -->
            <div class="qq-header">
                <div class="qq-header-left" @click="onBack">
                    <!-- 返回图标 -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </div>
                <div class="qq-title">{{ currentTabTitle }}</div>
                <div class="qq-header-actions">
                    <!-- 加号图标：用 SVG 保证与返回键一致，不受字体影响 -->
                    <span class="qq-action-btn" aria-label="新增" @click="toggleAddMenu">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                             viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </span>
                </div>
            </div>

            <template v-if="activeTab === 'messages'">
                <!-- 搜索栏 -->
                <div class="qq-search-container">
                    <div class="qq-search-bar">
                        <!-- 搜索图标 -->
                        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <span class="search-text">搜索</span>
                    </div>
                </div>

                <!-- 消息列表 -->
                <div class="qq-message-list">
                    <div 
                        class="qq-message-item" 
                        :class="{ 'is-pinned': msg.pinned }"
                        v-for="msg in sortedMessages" 
                        :key="msg.id"
                        @click="openChat(msg)"
                        @touchstart="handleTouchStart($event, msg)"
                        @touchend="handleTouchEnd"
                        @touchmove="handleTouchMove"
                        @contextmenu.prevent="showContextMenu(msg)"
                    >
                        <div class="qq-pin-indicator" v-if="msg.pinned">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                        </div>
                        <div class="qq-item-avatar" :style="{ backgroundImage: 'url(' + msg.avatar + ')' }"></div>
                        <div class="qq-item-content">
                            <div class="qq-item-top">
                                <span class="qq-item-name">{{ msg.name }}</span>
                                <span class="qq-item-time">{{ msg.time }}</span>
                            </div>
                            <div class="qq-item-bottom">
                                <span class="qq-item-preview">{{ msg.preview }}</span>
                                <span v-if="msg.unread > 0" class="qq-item-badge">{{ msg.unread }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 空状态 -->
                    <div v-if="messages.length === 0" class="empty-state"></div>
                </div>
            </template>

            <div v-else-if="activeTab === 'contacts'" class="qq-contacts-page">
                <div class="qq-contacts-hero">
                    <div class="qq-contacts-hero-left">
                        <div class="qq-contacts-title">我的联系人</div>
                        <div class="qq-contacts-sub">共 {{ contacts.length }} 位角色</div>
                    </div>
                    <div class="qq-contacts-hero-badge">QQ</div>
                </div>

                <div class="qq-contacts-quick">
                    <button class="qq-quick-item" type="button">
                        <span class="qq-quick-icon">新</span>
                        <span class="qq-quick-label">新朋友</span>
                    </button>
                    <button class="qq-quick-item" type="button">
                        <span class="qq-quick-icon">群</span>
                        <span class="qq-quick-label">群聊</span>
                    </button>
                    <button class="qq-quick-item" type="button">
                        <span class="qq-quick-icon">设</span>
                        <span class="qq-quick-label">分组</span>
                    </button>
                    <button class="qq-quick-item" type="button">
                        <span class="qq-quick-icon">星</span>
                        <span class="qq-quick-label">特别关心</span>
                    </button>
                </div>

                <div v-if="contactSections.length" class="qq-contacts-sections">
                    <div class="qq-contacts-section" v-for="section in contactSections" :key="section.key">
                        <div class="qq-contacts-section-title">{{ section.title }}</div>
                        <div class="qq-contacts-list">
                            <div
                                class="qq-contact-row"
                                v-for="contact in section.items"
                                :key="contact.id"
                                @click="openContact(contact)"
                            >
                                <div class="qq-contact-avatar" :style="{ backgroundImage: 'url(' + contact.avatar + ')' }"></div>
                                <div class="qq-contact-info">
                                    <div class="qq-contact-top">
                                        <span class="qq-contact-name">{{ contact.name }}</span>
                                        <span v-if="contact.pinned" class="qq-contact-tag">星标</span>
                                    </div>
                                    <div class="qq-contact-desc">{{ contact.desc }}</div>
                                </div>
                                <div class="qq-contact-arrow">&gt;</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="qq-contacts-empty">暂无联系人，先创建一个角色吧。</div>
            </div>

            <div v-else-if="activeTab === 'moments'" class="qq-moments-page">
                <div class="qq-moments-hero">
                    <div class="qq-moments-hero-left">
                        <div class="qq-moments-title">QQ 动态</div>
                        <div class="qq-moments-sub">角色和我都可以发动态与评论</div>
                    </div>
                    <div class="qq-moments-hero-badge">NEW</div>
                </div>

                <div class="qq-moments-composer">
                    <div class="qq-moments-composer-row">
                        <span class="qq-moments-label">发布身份</span>
                        <select v-model="momentAuthor" class="qq-moments-select">
                            <option v-for="option in authorOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <textarea
                        v-model="momentDraft"
                        class="qq-moments-textarea"
                        placeholder="分享一下此刻的心情..."
                    ></textarea>
                    <div class="qq-moments-actions">
                        <button class="qq-moments-send" type="button" :disabled="!momentDraft.trim()" @click="publishMoment">
                            发布
                        </button>
                    </div>
                </div>

                <div v-if="moments.length" class="qq-moments-list">
                    <div class="qq-moment-card" v-for="moment in moments" :key="moment.id">
                        <div class="qq-moment-header">
                            <div class="qq-moment-avatar" :style="{ backgroundImage: 'url(' + getAuthorAvatar(moment) + ')' }"></div>
                            <div class="qq-moment-meta">
                                <div class="qq-moment-name">{{ getAuthorName(moment) }}</div>
                                <div class="qq-moment-time">{{ formatMomentTime(moment.timestamp) }}</div>
                            </div>
                        </div>
                        <div class="qq-moment-content">{{ moment.content }}</div>

                        <div class="qq-moment-comments">
                            <div v-if="moment.comments && moment.comments.length" class="qq-moment-comment-list">
                                <div class="qq-moment-comment" v-for="comment in moment.comments" :key="comment.id">
                                    <div class="qq-moment-comment-avatar" :style="{ backgroundImage: 'url(' + getAuthorAvatar(comment) + ')' }"></div>
                                    <div class="qq-moment-comment-body">
                                        <div class="qq-moment-comment-name">{{ getAuthorName(comment) }}</div>
                                        <div class="qq-moment-comment-text">{{ comment.content }}</div>
                                    </div>
                                </div>
                            </div>

                            <div class="qq-moment-comment-form">
                                <select v-model="commentAuthors[moment.id]" class="qq-moments-select small">
                                    <option v-for="option in authorOptions" :key="option.value" :value="option.value">
                                        {{ option.label }}
                                    </option>
                                </select>
                                <input
                                    v-model="commentDrafts[moment.id]"
                                    class="qq-moment-comment-input"
                                    placeholder="评论一下..."
                                    @keyup.enter="submitComment(moment)"
                                />
                                <button
                                    class="qq-moment-comment-send"
                                    type="button"
                                    :disabled="!commentDrafts[moment.id] || !commentDrafts[moment.id].trim()"
                                    @click="submitComment(moment)"
                                >
                                    发送
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="qq-moments-empty">还没有动态，先发一条吧～</div>
            </div>

            <!-- 长按操作菜单 -->
            <div v-if="activeTab === 'messages' && showLongPressMenu" class="qq-action-sheet-mask" @click="closeLongPressMenu">
                <div class="qq-action-sheet" @click.stop>
                    <div class="qq-action-sheet-title">{{ selectedContact?.name }}</div>
                    <button class="qq-action-sheet-btn" @click="togglePin">
                        {{ selectedContact?.pinned ? '取消置顶' : '置顶聊天' }}
                    </button>
                    <button class="qq-action-sheet-btn danger" @click="deleteContact">删除聊天</button>
                    <button class="qq-action-sheet-cancel" @click="closeLongPressMenu">取消</button>
                </div>
            </div>

            <!-- 底部导航 -->
            <div class="qq-tab-bar">
                <div class="qq-tab-item" :class="{ active: activeTab === 'messages' }" @click="activeTab = 'messages'">
                    <!-- 消息图标 -->
                    <svg class="qq-tab-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span class="qq-tab-label">消息</span>
                </div>
                <div class="qq-tab-item" :class="{ active: activeTab === 'contacts' }" @click="activeTab = 'contacts'">
                    <!-- 联系人图标 -->
                    <svg class="qq-tab-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    <span class="qq-tab-label">联系人</span>
                </div>
                <div class="qq-tab-item" :class="{ active: activeTab === 'moments' }" @click="activeTab = 'moments'">
                    <!-- 动态图标 -->
                    <svg class="qq-tab-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <span class="qq-tab-label">动态</span>
                </div>
            </div>

            <!-- 添加角色动作面板 -->
            <div v-if="showAddMenu" class="qq-action-sheet-mask" @click="closeAddMenu">
                <div class="qq-action-sheet" @click.stop>
                    <div class="qq-action-sheet-title">添加角色</div>
                    <button class="qq-action-sheet-btn" @click="handleCreateRole">创建角色</button>
                    <button class="qq-action-sheet-btn" :disabled="importing" @click="triggerImportCard">
                        {{ importing ? '导入中...' : '导入 SillyTavern 角色卡' }}
                    </button>
                    <div class="qq-add-hint">支持 SillyTavern JSON/PNG 角色卡，导入角色设定与世界书。</div>
                    <button class="qq-action-sheet-cancel" @click="closeAddMenu">取消</button>
                </div>
            </div>

            <input
                ref="cardInput"
                class="file-input"
                type="file"
                accept=".json,.png,application/json,image/png"
                @change="handleImportFile"
            />
        </div>
    `,
    props: {
        onBack: Function,
        onOpenChat: Function,
        onCreateRole: Function,
        onImportCard: Function,
        onDeleteRole: Function,
        roles: {
            type: Array,
            default: () => []
        },
        messagesCache: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            messages: [],
            showAddMenu: false,
            importing: false,
            // 长按相关
            showLongPressMenu: false,
            selectedContact: null,
            longPressTimer: null,
            touchStartPos: { x: 0, y: 0 },
            pinnedContacts: JSON.parse(localStorage.getItem('pinnedContacts') || '[]'),
            activeTab: 'messages',
            moments: [],
            momentDraft: '',
            momentAuthor: 'user',
            commentDrafts: {},
            commentAuthors: {},
            // iOS风格默认头像
            defaultAvatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%23C7C7CC'/%3E%3Ccircle cx='30' cy='24' r='10' fill='%23fff'/%3E%3Cpath d='M30 36c-10 0-18 6-18 14v2h36v-2c0-8-8-14-18-14z' fill='%23fff'/%3E%3C/svg%3E",
            userAvatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%23007AFF'/%3E%3Ccircle cx='30' cy='24' r='10' fill='%23fff'/%3E%3Cpath d='M30 36c-10 0-18 6-18 14v2h36v-2c0-8-8-14-18-14z' fill='%23fff'/%3E%3C/svg%3E"
        }
    },
    computed: {
        currentTabTitle() {
            if (this.activeTab === 'contacts') return '联系人';
            if (this.activeTab === 'moments') return '动态';
            return '消息';
        },
        // 排序后的消息列表：置顶的在前面
        sortedMessages() {
            return [...this.messages].sort((a, b) => {
                const aPinned = this.pinnedContacts.includes(a.id);
                const bPinned = this.pinnedContacts.includes(b.id);
                a.pinned = aPinned;
                b.pinned = bPinned;
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;
                return 0;
            });
        },
        contacts() {
            return (this.roles || [])
                .map((role) => ({
                    id: role.id,
                    name: role.name || '未命名',
                    avatar: role.avatar || this.defaultAvatar,
                    desc: this.buildContactDesc(role),
                    pinned: this.pinnedContacts.includes(role.id),
                    __role: role
                }))
                .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN', { sensitivity: 'base' }));
        },
        contactSections() {
            const pinned = this.contacts.filter((item) => item.pinned);
            const rest = this.contacts.filter((item) => !item.pinned);
            const sections = [];
            if (pinned.length) {
                sections.push({ key: 'pinned', title: '星标联系人', items: pinned });
            }
            if (rest.length) {
                sections.push({ key: 'all', title: '全部联系人', items: rest });
            }
            return sections;
        },
        authorOptions() {
            const options = [{ value: 'user', label: '我' }];
            (this.roles || []).forEach((role) => {
                const name = role?.name || '未命名';
                options.push({ value: `role:${role.id}`, label: name });
            });
            return options;
        }
    },
    watch: {
        roles: {
            immediate: true,
            handler(newVal) {
                this.updateMessages(newVal);
            }
        }
    },
    methods: {
        toggleAddMenu() {
            this.showAddMenu = !this.showAddMenu;
        },
        closeAddMenu() {
            this.showAddMenu = false;
        },
        handleCreateRole() {
            this.closeAddMenu();
            if (this.onCreateRole) this.onCreateRole();
        },
        triggerImportCard() {
            if (!this.onImportCard) {
                alert('未配置导入处理');
                return;
            }
            this.$refs.cardInput?.click();
        },
        async handleImportFile(event) {
            const file = event.target.files[0];
            event.target.value = '';
            if (!file || !this.onImportCard) return;
            this.importing = true;
            try {
                const result = await this.onImportCard(file);
                const infoText = result?.worldBookCount
                    ? `已导入「${result.roleName || '角色'}」，绑定 ${result.worldBookCount} 本世界书。`
                    : `已导入「${result.roleName || '角色'}」。`;
                alert(infoText);
            } catch (e) {
                console.error('导入角色卡失败', e);
                alert(e?.message || '导入失败，请确认文件格式为 SillyTavern 角色卡');
            } finally {
                this.importing = false;
                this.closeAddMenu();
            }
        },

        // 获取角色的最后一条聊天记录（同时缓存整个消息数组，供 QQChatPage 复用）
        getLastMessage(roleId) {
            try {
                const key = `chat_${roleId}`;
                const saved = localStorage.getItem(key);
                if (saved) {
                    const messages = JSON.parse(saved);
                    
                    // 缓存解析后的消息数组，避免 QQChatPage 再次解析
                    if (this.messagesCache && messages) {
                        this.messagesCache[roleId] = {
                            messages: messages,
                            timestamp: Date.now()
                        };
                    }
                    
                    if (messages && messages.length > 0) {
                        const lastMsg = messages[messages.length - 1];
                        return {
                            content: lastMsg.content,
                            isUser: lastMsg.role === 'user',
                            timestamp: lastMsg.timestamp || null
                        };
                    }
                }
            } catch (e) {
                console.error('获取最后消息失败:', e);
            }
            return null;
        },

        // 格式化时间
        formatTime(date) {
            const now = new Date();
            const msgDate = new Date(date);
            const pad = (n) => String(n).padStart(2, '0');
            
            // 如果是今天，显示时间
            if (msgDate.toDateString() === now.toDateString()) {
                return `${pad(msgDate.getHours())}:${pad(msgDate.getMinutes())}`;
            }
            
            // 如果是昨天
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (msgDate.toDateString() === yesterday.toDateString()) {
                return '昨天';
            }
            
            // 其他情况显示日期
            return `${pad(msgDate.getMonth() + 1)}/${pad(msgDate.getDate())}`;
        },

        formatMomentTime(timestamp) {
            return this.formatTime(timestamp);
        },

        buildAuthorValue(authorType, authorId) {
            if (authorType === 'role' && authorId) return `role:${authorId}`;
            return 'user';
        },

        parseAuthorValue(value) {
            if (!value || value === 'user') return { type: 'user', id: null };
            if (value.startsWith('role:')) {
                return { type: 'role', id: value.slice(5) };
            }
            return { type: 'user', id: null };
        },

        resolveAuthorMeta(authorType, authorId) {
            if (authorType === 'role' && authorId) {
                const role = (this.roles || []).find((r) => r.id === authorId);
                return {
                    name: role?.name || '未知角色',
                    avatar: role?.avatar || this.defaultAvatar
                };
            }
            return {
                name: '我',
                avatar: this.userAvatar
            };
        },

        getAuthorName(entry) {
            const meta = this.resolveAuthorMeta(entry.authorType, entry.authorId);
            return meta.name;
        },

        getAuthorAvatar(entry) {
            const meta = this.resolveAuthorMeta(entry.authorType, entry.authorId);
            return meta.avatar;
        },

        loadMoments() {
            try {
                const saved = localStorage.getItem('qqMoments');
                if (saved) {
                    this.moments = JSON.parse(saved) || [];
                } else {
                    this.moments = [];
                }
            } catch (e) {
                console.error('加载动态失败:', e);
                this.moments = [];
            }

            this.moments.forEach((moment) => {
                if (!moment.comments) moment.comments = [];
                if (this.commentDrafts[moment.id] === undefined) this.commentDrafts[moment.id] = '';
                if (this.commentAuthors[moment.id] === undefined) this.commentAuthors[moment.id] = 'user';
            });
        },

        saveMoments() {
            try {
                localStorage.setItem('qqMoments', JSON.stringify(this.moments));
            } catch (e) {
                console.error('保存动态失败:', e);
            }
        },

        publishMoment() {
            const text = this.momentDraft.trim();
            if (!text) return;
            const author = this.parseAuthorValue(this.momentAuthor);
            const moment = {
                id: `moment_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                authorType: author.type,
                authorId: author.id,
                content: text,
                timestamp: Date.now(),
                comments: []
            };
            this.moments.unshift(moment);
            this.momentDraft = '';
            this.commentDrafts[moment.id] = '';
            this.commentAuthors[moment.id] = this.momentAuthor || 'user';
            this.saveMoments();
        },

        submitComment(moment) {
            if (!moment) return;
            const draft = (this.commentDrafts[moment.id] || '').trim();
            if (!draft) return;
            const author = this.parseAuthorValue(this.commentAuthors[moment.id]);
            const comment = {
                id: `comment_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                authorType: author.type,
                authorId: author.id,
                content: draft,
                timestamp: Date.now()
            };
            moment.comments = moment.comments || [];
            moment.comments.push(comment);
            this.commentDrafts[moment.id] = '';
            this.saveMoments();
        },

        // 更新消息列表
        updateMessages(roles) {
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

            this.messages = (roles || []).map((r) => {
                const lastMsg = this.getLastMessage(r.id);
                let preview = '点击开始聊天';
                let time = currentTime;
                
                if (lastMsg) {
                    // 截取预览文本，最多显示30个字符
                    let content = lastMsg.content || '';
                    if (content.length > 30) {
                        content = content.substring(0, 30) + '...';
                    }
                    // 如果是用户发的消息，加上"我："前缀
                    preview = lastMsg.isUser ? `我：${content}` : content;

                    if (lastMsg.timestamp) {
                        time = this.formatTime(lastMsg.timestamp);
                    }
                }

                return {
                    id: r.id,
                    name: r.name,
                    avatar: r.avatar || this.defaultAvatar,
                    time,
                    preview,
                    unread: 0,
                    __role: r
                };
            });
        },

        openChat(msg) {
            // 如果正在显示长按菜单，不触发点击
            if (this.showLongPressMenu) return;
            if (this.onOpenChat) return this.onOpenChat(msg.__role);
            console.log(`打开与 ${msg.name} 的聊天`);
        },

        openContact(contact) {
            if (this.onOpenChat) return this.onOpenChat(contact.__role);
        },

        buildContactDesc(role) {
            const raw = role?.setting || role?.aiPersona || role?.myPersona || '';
            const clean = String(raw).replace(/\s+/g, ' ').trim();
            if (!clean) return '点击开始聊天';
            return clean.length > 34 ? `${clean.slice(0, 34)}...` : clean;
        },

        // 长按相关方法
        handleTouchStart(event, msg) {
            const touch = event.touches[0];
            this.touchStartPos = { x: touch.clientX, y: touch.clientY };
            this.longPressTimer = setTimeout(() => {
                this.showContextMenu(msg);
            }, 500); // 500ms 触发长按
        },

        handleTouchEnd() {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        },

        handleTouchMove(event) {
            if (!this.longPressTimer) return;
            const touch = event.touches[0];
            const dx = Math.abs(touch.clientX - this.touchStartPos.x);
            const dy = Math.abs(touch.clientY - this.touchStartPos.y);
            // 如果移动超过10px，取消长按
            if (dx > 10 || dy > 10) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        },

        showContextMenu(msg) {
            this.selectedContact = msg;
            this.showLongPressMenu = true;
            // 触发震动反馈（如果支持）
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        },

        closeLongPressMenu() {
            this.showLongPressMenu = false;
            this.selectedContact = null;
        },

        togglePin() {
            if (!this.selectedContact) return;
            const id = this.selectedContact.id;
            const index = this.pinnedContacts.indexOf(id);
            if (index > -1) {
                // 取消置顶
                this.pinnedContacts.splice(index, 1);
            } else {
                // 添加置顶
                this.pinnedContacts.push(id);
            }
            // 保存到 localStorage
            localStorage.setItem('pinnedContacts', JSON.stringify(this.pinnedContacts));
            this.closeLongPressMenu();
        },

        deleteContact() {
            if (!this.selectedContact) return;
            const msg = this.selectedContact;
            const confirmDelete = confirm(`确定要删除与「${msg.name}」的聊天吗？\n这将同时删除该角色和所有聊天记录。`);
            if (confirmDelete) {
                // 从 pinnedContacts 中移除
                const pinIndex = this.pinnedContacts.indexOf(msg.id);
                if (pinIndex > -1) {
                    this.pinnedContacts.splice(pinIndex, 1);
                    localStorage.setItem('pinnedContacts', JSON.stringify(this.pinnedContacts));
                }
                // 删除聊天记录
                localStorage.removeItem(`chat_${msg.id}`);
                
                // 从本地 messages 中移除
                const msgIndex = this.messages.findIndex(m => m.id === msg.id);
                if (msgIndex > -1) {
                    this.messages.splice(msgIndex, 1);
                }
                
                // 更新 qqRoles 存储（这是正确的存储键）
                try {
                    const savedRoles = JSON.parse(localStorage.getItem('qqRoles') || '[]');
                    const newRoles = savedRoles.filter(r => r.id !== msg.id);
                    localStorage.setItem('qqRoles', JSON.stringify(newRoles));
                } catch (e) {
                    console.error('删除角色失败:', e);
                }
                
                // 通过 prop 回调通知父组件删除角色
                if (this.onDeleteRole) {
                    this.onDeleteRole(msg.id);
                }
            }
            this.closeLongPressMenu();
        }
    },
    mounted() {
        // 初始化时更新消息列表
        this.updateMessages(this.roles);
        this.loadMoments();
    }
};
