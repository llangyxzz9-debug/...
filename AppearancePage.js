// 外观设置页面组件
export const AppearancePage = {
    template: `
        <div class="appearance-page">
            <div class="appearance-header">
                <button class="back-btn" @click="onBack">←</button>
                <h2 class="appearance-title">外观设置</h2>
            </div>
            
            <div class="appearance-content">
                <!-- A. 主屏幕壁纸设置 -->
                <div class="appearance-section">
                    <h3 class="section-title">🖼️ 主屏幕壁纸</h3>
                    <p class="section-desc">选择一张图片作为主屏幕背景</p>
                    <button class="btn-upload" @click="triggerWallpaperUpload">
                        <span class="btn-icon">📁</span>
                        上传图片
                    </button>
                    <div v-if="hasWallpaper" class="wallpaper-preview">
                        <span class="preview-text">✓ 已设置壁纸</span>
                        <button class="btn-clear" @click="clearWallpaper">清除</button>
                    </div>
                </div>
                
                <!-- B. 全屏模式切换 -->
                <div class="appearance-section">
                    <h3 class="section-title">📱 沉浸全屏</h3>
                    <p class="section-desc">隐藏手机外壳，内容铺满整个窗口</p>
                    <div class="toggle-container">
                        <label class="toggle-switch">
                            <input 
                                type="checkbox" 
                                v-model="fullscreenMode"
                                @change="toggleFullscreen"
                            >
                            <span class="toggle-slider"></span>
                        </label>
                        <span class="toggle-label">{{ fullscreenMode ? '已开启' : '已关闭' }}</span>
                    </div>
                </div>
                
                <!-- C. 图标设置管理器 -->
                <div class="appearance-section icon-manager-section">
                    <h3 class="section-title">🎯 图标设置</h3>
                    <p class="section-desc">为主屏幕上的每个 App 单独设置图标</p>
                    
                    <!-- 未展开时显示入口按钮 -->
                    <button 
                        v-if="!showIconManager" 
                        class="btn-icon-manager" 
                        @click="openIconManager"
                    >
                        <span class="btn-icon">⚙️</span>
                        打开图标管理器
                    </button>
                    
                    <!-- 展开后显示图标管理面板 -->
                    <div v-if="showIconManager" class="icon-manager-panel">
                        <div class="icon-manager-panel-header">
                            <button class="btn-back-small" @click="closeIconManager">←</button>
                            <h4 class="panel-title">图标管理器</h4>
                        </div>
                        
                        <div class="app-icon-list">
                            <div 
                                v-for="(app, index) in appList" 
                                :key="app.id"
                                class="app-icon-item"
                            >
                                <div class="app-icon-item-header">
                                    <div class="app-icon-preview">
                                        <img 
                                            v-if="app.customIcon" 
                                            :src="app.customIcon" 
                                            :alt="app.name"
                                        />
                                        <span v-else>{{ app.defaultIcon }}</span>
                                    </div>
                                    <span class="app-icon-name">{{ app.name }}</span>
                                    <button 
                                        v-if="app.customIcon"
                                        class="btn-clear-small" 
                                        @click="clearAppIcon(index)"
                                    >清除</button>
                                </div>
                                
                                <div class="app-icon-controls">
                                    <div class="app-icon-control-row">
                                        <button 
                                            class="btn-upload-small" 
                                            @click="triggerAppIconUpload(index)"
                                        >
                                            📁 本地上传
                                        </button>
                                        <input 
                                            type="file" 
                                            :ref="el => { if (el) fileInputRefs[index] = el }"
                                            class="hidden-file-input"
                                            accept="image/*"
                                            @change="handleAppIconFile($event, index)"
                                        />
                                    </div>
                                    <div class="app-icon-control-row">
                                        <input 
                                            type="text" 
                                            class="form-input"
                                            v-model="app.iconUrl"
                                            placeholder="输入图标 URL..."
                                        />
                                        <button 
                                            class="btn-apply-small" 
                                            @click="applyAppIconUrl(index)"
                                        >应用</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- D. 自定义 CSS -->
                <div class="appearance-section">
                    <h3 class="section-title">🎨 自定义 CSS</h3>
                    <p class="section-desc">输入自定义样式代码，实时生效</p>
                    <textarea 
                        class="css-textarea"
                        v-model="customCss"
                        @input="applyCustomCss"
                        placeholder="/* 在这里输入 CSS 代码... */
例如：
.home-page {
    background: linear-gradient(to bottom, #ff9a9e, #fecfef);
}"
                    ></textarea>
                </div>
            </div>
        </div>
    `,
    
    props: {
        onBack: {
            type: Function,
            required: true
        },
        onWallpaperUpload: {
            type: Function,
            required: true
        },
        onIconUpload: {
            type: Function,
            required: true
        },
        currentWallpaper: {
            type: String,
            default: null
        },
        currentIcon: {
            type: String,
            default: null
        }
    },
    
    data() {
        return {
            fullscreenMode: false,
            iconUrl: '',
            customCss: '',
            customIconPreview: null,
            showIconManager: false,
            // 应用列表 - 将从主屏幕动态读取
            appList: [],
            // 文件输入引用
            fileInputRefs: []
        };
    },
    
    computed: {
        hasWallpaper() {
            return !!this.currentWallpaper;
        },
        hasCustomIcon() {
            return !!this.customIconPreview || !!this.currentIcon;
        }
    },
    
    methods: {
        triggerWallpaperUpload() {
            this.onWallpaperUpload();
        },
        
        triggerIconUpload() {
            this.onIconUpload();
        },
        
        clearWallpaper() {
            this.$emit('clear-wallpaper');
        },
        
        toggleFullscreen() {
            const body = document.body;
            if (this.fullscreenMode) {
                body.classList.add('fullscreen-mode');
            } else {
                body.classList.remove('fullscreen-mode');
            }
            // 保存到 localStorage
            localStorage.setItem('fullscreenMode', this.fullscreenMode);
        },
        
        applyIconUrl() {
            if (this.iconUrl.trim()) {
                this.customIconPreview = this.iconUrl;
                this.$emit('set-custom-icon', this.iconUrl);
            }
        },
        
        clearCustomIcon() {
            this.customIconPreview = null;
            this.iconUrl = '';
            this.$emit('clear-custom-icon');
        },
        
        applyCustomCss() {
            // 获取或创建自定义样式标签
            let styleTag = document.getElementById('custom-user-css');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'custom-user-css';
                document.head.appendChild(styleTag);
            }
            // 写入用户的 CSS
            styleTag.textContent = this.customCss;
            // 保存到 localStorage
            localStorage.setItem('customCss', this.customCss);
        },
        
        setCustomIcon(dataUrl) {
            this.customIconPreview = dataUrl;
        },
        
        // ========== 图标管理器方法 ==========
        
        openIconManager() {
            this.showIconManager = true;
            this.loadAppList();
        },
        
        closeIconManager() {
            this.showIconManager = false;
        },
        
        // 从主屏幕动态读取 App 列表
        loadAppList() {
            // 定义主屏幕上的所有可配置 App
            // 包括 grid-buttons 中的 4 个按钮和 dock-bar 中的 3 个按钮
            const defaultApps = [
                { id: 'grid-qq', name: 'QQ', defaultIcon: '🐧', type: 'grid', index: 0 },
                { id: 'grid-preset', name: '预设', defaultIcon: '⚙️', type: 'grid', index: 1 },
                { id: 'grid-world', name: '世界书', defaultIcon: '🌍', type: 'grid', index: 2 },
                { id: 'grid-appearance', name: '外观', defaultIcon: '🎨', type: 'grid', index: 3 },
                { id: 'dock-api', name: 'API设置', defaultIcon: '🔌', type: 'dock', index: 0 },
                { id: 'dock-font', name: '字体', defaultIcon: 'Aa', type: 'dock', index: 1 },
                { id: 'dock-forum', name: '论坛', defaultIcon: '💬', type: 'dock', index: 2 }
            ];
            
            // 从 localStorage 加载已保存的自定义图标
            const savedIcons = this.loadSavedAppIcons();
            
            // 合并默认配置和已保存的自定义图标
            this.appList = defaultApps.map(app => ({
                ...app,
                customIcon: savedIcons[app.id] || null,
                iconUrl: ''
            }));
        },
        
        // 从 localStorage 加载保存的图标
        loadSavedAppIcons() {
            try {
                const saved = localStorage.getItem('appCustomIcons');
                return saved ? JSON.parse(saved) : {};
            } catch (e) {
                console.error('加载自定义图标失败:', e);
                return {};
            }
        },
        
        // 保存图标到 localStorage
        saveAppIcons() {
            const icons = {};
            this.appList.forEach(app => {
                if (app.customIcon) {
                    icons[app.id] = app.customIcon;
                }
            });
            localStorage.setItem('appCustomIcons', JSON.stringify(icons));
            
            // 通知父组件更新图标
            this.$emit('update-app-icons', icons);
        },
        
        // 触发特定 App 的文件上传
        triggerAppIconUpload(index) {
            const fileInput = this.fileInputRefs[index];
            if (fileInput) {
                fileInput.click();
            }
        },
        
        // 处理 App 图标文件上传
        handleAppIconFile(event, index) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target.result;
                    // 使用 Vue 3 响应式方式更新数组元素
                    const updatedApp = { ...this.appList[index], customIcon: dataUrl };
                    this.appList.splice(index, 1, updatedApp);
                    this.saveAppIcons();
                    this.applyIconToDOM(index);
                };
                reader.readAsDataURL(file);
            }
            // 清空文件输入
            event.target.value = '';
        },
        
        // 通过 URL 应用 App 图标
        applyAppIconUrl(index) {
            const url = this.appList[index].iconUrl.trim();
            if (url) {
                // 使用 Vue 3 响应式方式更新数组元素
                const updatedApp = { ...this.appList[index], customIcon: url, iconUrl: '' };
                this.appList.splice(index, 1, updatedApp);
                this.saveAppIcons();
                this.applyIconToDOM(index);
            }
        },
        
        // 清除特定 App 的自定义图标
        clearAppIcon(index) {
            // 使用 Vue 3 响应式方式更新数组元素
            const updatedApp = { ...this.appList[index], customIcon: null };
            this.appList.splice(index, 1, updatedApp);
            this.saveAppIcons();
            this.applyIconToDOM(index);
        },
        
        // 将图标应用到 DOM 元素（注意：当外观页面打开时，主页DOM不存在）
        // 这个方法主要用于通知父组件更新，实际DOM更新在返回主页后由app.js处理
        applyIconToDOM(index) {
            // 图标已经保存到localStorage，父组件会在返回主页时应用
            // 这里不需要直接操作DOM，因为主页可能未渲染
            console.log('图标已更新:', this.appList[index].name);
        },
        
        // 应用所有保存的图标到 DOM
        applyAllIconsToDOM() {
            const savedIcons = this.loadSavedAppIcons();
            
            // 应用 grid 按钮图标
            const gridBtns = document.querySelectorAll('.grid-btn');
            const gridApps = [
                { id: 'grid-qq', defaultIcon: '🐧' },
                { id: 'grid-preset', defaultIcon: '⚙️' },
                { id: 'grid-world', defaultIcon: '🌍' },
                { id: 'grid-appearance', defaultIcon: '🎨' }
            ];
            
            gridBtns.forEach((btn, index) => {
                if (gridApps[index]) {
                    const iconSpan = btn.querySelector('.grid-icon');
                    if (iconSpan) {
                        const customIcon = savedIcons[gridApps[index].id];
                        if (customIcon) {
                            iconSpan.innerHTML = `<img src="${customIcon}" class="custom-icon-img" alt="" />`;
                        }
                    }
                }
            });
            
            // 应用 dock 按钮图标
            const dockItems = document.querySelectorAll('.dock-item');
            const dockApps = [
                { id: 'dock-api', defaultIcon: '🔌' },
                { id: 'dock-font', defaultIcon: 'Aa' },
                { id: 'dock-forum', defaultIcon: '💬' }
            ];
            
            dockItems.forEach((item, index) => {
                if (dockApps[index]) {
                    const iconSpan = item.querySelector('.dock-icon');
                    if (iconSpan) {
                        const customIcon = savedIcons[dockApps[index].id];
                        if (customIcon) {
                            iconSpan.innerHTML = `<img src="${customIcon}" class="custom-icon-img" alt="" />`;
                        }
                    }
                }
            });
        },
        
        loadSavedSettings() {
            // 加载全屏模式设置
            const savedFullscreen = localStorage.getItem('fullscreenMode');
            if (savedFullscreen === 'true') {
                this.fullscreenMode = true;
                document.body.classList.add('fullscreen-mode');
            }
            
            // 加载自定义 CSS
            const savedCss = localStorage.getItem('customCss');
            if (savedCss) {
                this.customCss = savedCss;
                this.applyCustomCss();
            }
            
            // 加载自定义图标
            const savedIcon = localStorage.getItem('customIcon');
            if (savedIcon) {
                this.customIconPreview = savedIcon;
            }
        }
    },
    
    mounted() {
        this.loadSavedSettings();
        
        // 如果有传入的当前图标，显示预览
        if (this.currentIcon) {
            this.customIconPreview = this.currentIcon;
        }
        
        // 延迟应用保存的图标到 DOM（确保 DOM 已渲染）
        setTimeout(() => {
            this.applyAllIconsToDOM();
        }, 100);
    },
    
    watch: {
        currentIcon(newVal) {
            if (newVal) {
                this.customIconPreview = newVal;
            }
        }
    }
};
