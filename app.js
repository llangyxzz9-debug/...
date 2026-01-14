// 主应用入口
import { HomePage } from '.HomePage.js';
import { SettingsPage } from '.SettingsPage.js';
import { AppearancePage } from '.AppearancePage.js';

const { createApp, ref } = Vue;

// 根组件
const App = {
    template: `
        <div class="phone-case">
            <div class="screen" :class="{ 'has-wallpaper': wallpaperImage }">
                <!-- 壁纸层 -->
                <div 
                    v-if="wallpaperImage" 
                    class="wallpaper-layer"
                    :style="{ backgroundImage: 'url(' + wallpaperImage + ')' }"
                ></div>
                
                <!-- 主页 -->
                <HomePage 
                    v-if="currentPage === 'home'"
                    ref="homePageRef"
                    :on-show-settings="showSettings"
                    :on-show-appearance="showAppearance"
                    :custom-icon="customIcon"
                    @upload="handleUpload"
                />
                
                <!-- API 设置页面 -->
                <SettingsPage 
                    v-if="currentPage === 'settings'"
                    :on-back="goHome"
                />
                
                <!-- 外观设置页面 -->
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
            </div>
        </div>
        
        <!-- 全局文件输入 -->
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
        AppearancePage
    },
    
    data() {
        return {
            currentPage: 'home',
            currentUploadType: null,
            wallpaperImage: null,
            customIcon: null
        };
    },
    
    methods: {
        showSettings() {
            this.currentPage = 'settings';
        },
        
        showAppearance() {
            this.currentPage = 'appearance';
        },
        
        goHome() {
            this.currentPage = 'home';
            // 返回主页时，延迟应用保存的图标（等待DOM渲染）
            this.$nextTick(() => {
                setTimeout(() => {
                    this.loadAndApplyAppIcons();
                }, 50);
            });
        },
        
        handleUpload(type) {
            this.currentUploadType = type;
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
        
        handleFileChange(event) {
            const file = event.target.files[0];
            if (file && this.currentUploadType) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target.result;
                    
                    // 根据上传类型处理
                    switch (this.currentUploadType) {
                        case 'wallpaper':
                            this.wallpaperImage = dataUrl;
                            break;
                        case 'customIcon':
                            this.customIcon = dataUrl;
                            localStorage.setItem('customIcon', dataUrl);
                            // 通知外观页面更新预览
                            if (this.$refs.appearancePageRef) {
                                this.$refs.appearancePageRef.setCustomIcon(dataUrl);
                            }
                            break;
                        default:
                            // 通过 ref 调用 HomePage 的方法设置图片
                            if (this.$refs.homePageRef) {
                                this.$refs.homePageRef.setImage(this.currentUploadType, dataUrl);
                            }
                            break;
                    }
                };
                reader.readAsDataURL(file);
            }
            // 清空文件输入
            event.target.value = '';
        },
        
        clearWallpaper() {
            this.wallpaperImage = null;
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
            // 当图标管理器更新图标时，应用到主页
            this.applyAppIconsToHomePage(icons);
        },
        
        applyAppIconsToHomePage(icons) {
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
                        const customIcon = icons[gridApps[index].id];
                        if (customIcon) {
                            iconSpan.innerHTML = `<img src="${customIcon}" class="custom-icon-img" alt="" />`;
                        } else {
                            iconSpan.innerHTML = gridApps[index].defaultIcon;
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
                        const customIcon = icons[dockApps[index].id];
                        if (customIcon) {
                            iconSpan.innerHTML = `<img src="${customIcon}" class="custom-icon-img" alt="" />`;
                        } else {
                            iconSpan.innerHTML = dockApps[index].defaultIcon;
                        }
                    }
                }
            });
        },
        
        loadSavedSettings() {
            // 加载保存的自定义图标
            const savedIcon = localStorage.getItem('customIcon');
            if (savedIcon) {
                this.customIcon = savedIcon;
            }
            
            // 加载保存的全屏模式
            const savedFullscreen = localStorage.getItem('fullscreenMode');
            if (savedFullscreen === 'true') {
                document.body.classList.add('fullscreen-mode');
            }
            
            // 加载保存的自定义 CSS
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
            
            // 加载保存的应用图标并延迟应用（确保 DOM 已渲染）
            setTimeout(() => {
                this.loadAndApplyAppIcons();
            }, 200);
        },
        
        loadAndApplyAppIcons() {
            try {
                const saved = localStorage.getItem('appCustomIcons');
                if (saved) {
                    const icons = JSON.parse(saved);
                    this.applyAppIconsToHomePage(icons);
                }
            } catch (e) {
                console.error('加载应用图标失败:', e);
            }
        }
    },
    
    mounted() {
        this.loadSavedSettings();
    }
};

// 创建并挂载 Vue 应用
createApp(App).mount('#app');

