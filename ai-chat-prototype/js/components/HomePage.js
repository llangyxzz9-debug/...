// 主页组件
export const HomePage = {
    template: `
        <div class="home-page">
            <!-- 第一部分：Top（时间框：双层图片上传） -->
            <div
                class="section-top time-box"
                :style="timeBoxBgStyle"
                @click="triggerUpload('timeBg')"
            >
                <!-- 时间文字（中间层，盖在背景图上） -->
                <div v-if="!hideTime" class="date-display" :style="{ color: timeColor }">{{ dateDisplay }}</div>
                <div v-if="!hideTime" class="time-display" :style="{ color: timeColor }">{{ timeDisplay }}</div>

                <!-- 右侧装饰图区域（点击区域 B，强制右侧绝对定位） -->
                <div class="time-box-deco" @click.stop="handleTimeDecoAreaClick">
                    <img
                        v-if="timeDecoImage"
                        class="time-box-deco-img"
                        :src="timeDecoImage"
                        alt=""
                    />
                    <button
                        v-if="timeDecoImage && showTimeDecoRemove"
                        class="time-box-deco-remove"
                        type="button"
                        @click.stop="removeTimeDeco"
                        aria-label="删除装饰图"
                    >
                        ×
                    </button>
                </div>
            </div>

            <!-- 第二部分：Middle-Top -->
            <div class="section-middle-top">
                <div class="info-left">
                    <div class="editable-text big-text" @click="editContent('greeting')">{{ greeting }}</div>
                    <div class="editable-text normal-text" @click="editContent('subtitle')">{{ subtitle }}</div>
                    
                    <div class="profile-card">
                        <div 
                            class="profile-avatar" 
                            :style="avatarStyle"
                            @click="triggerUpload('avatar')"
                        ></div>
                        <div class="editable-text profile-text" @click="editContent('profileText')">{{ profileText }}</div>
                    </div>
                </div>
                
                <div class="grid-buttons">
                    <div 
                        class="grid-btn" 
                        v-for="btn in gridButtons" 
                        :key="btn.label"
                        @click="btn.action ? btn.action() : null"
                    >
                        <span class="grid-icon" :style="btn.iconStyle || {}">
                            <img v-if="btn.iconImage" :src="btn.iconImage" class="custom-icon-img" />
                            <template v-else>{{ btn.icon }}</template>
                        </span>
                        <span class="grid-label">{{ btn.label }}</span>
                    </div>
                </div>
            </div>

            <!-- 第三部分：Middle-Bottom -->
            <div class="section-middle-bottom">
                <!-- 装饰图片 -->
                <div 
                    class="deco-image-area" 
                    :class="{ 'has-image': decoImage }"
                    :style="decoStyle"
                    @click="triggerUpload('deco')"
                ></div>

                <!-- 音乐播放器 -->
                <div class="music-player">
                    <div 
                        class="vinyl-record" 
                        :class="{ playing: isPlaying }"
                        @click="toggleMusic"
                    >
                        <div 
                            class="vinyl-center" 
                            :style="vinylStyle"
                            @click.stop="triggerUpload('vinyl')"
                        ></div>
                    </div>
                </div>
            </div>
            
            <!-- 第四部分：Dock 栏 -->
            <div class="dock-bar">
                <div class="dock-item" v-for="item in dockItems" :key="item.label" @click="item.action">
                    <span class="dock-icon">
                        <img v-if="item.iconImage" :src="item.iconImage" class="custom-icon-img" />
                        <template v-else>{{ item.icon }}</template>
                    </span>
                    <span class="dock-label">{{ item.label }}</span>
                </div>
            </div>
        </div>
    `,
    
    props: {
        onShowSettings: {
            type: Function,
            required: true
        },
        onShowAppearance: {
            type: Function,
            required: true
        },
        onShowFontSettings: {
            type: Function,
            required: true
        },
        onShowPreset: {
            type: Function,
            required: false
        },
        onShowWorldBook: {
            type: Function,
            required: false
        },
        onShowForum: {
            type: Function,
            required: false
        },
        customIcon: {
            type: String,
            default: null
        },
        appIcons: {
            type: Object,
            default: () => ({})
        }
    },
    
    data() {
        return {
            // 时间显示
            timeDisplay: '12:00',
            dateDisplay: '1月1日 星期一',
            
            // 可编辑文本
            greeting: '早安',
            subtitle: '今天也要开心哦',
            profileText: '点击上传',
            
            // 图片
            avatarImage: null,
            vinylImage: null,
            decoImage: null,

            // 第一部分时间框：双层图片
            timeBgImage: null, // 背景图（区域 A）
            timeDecoImage: null, // 右侧装饰图（区域 B）
            showTimeDecoRemove: false,
            
            // 音乐播放状态
            isPlaying: false,
            
            // 时间设置
            hideTime: false,
            timeColor: '#ffffff',
            
            // 时间更新定时器
            timeInterval: null
        };
    },
    
    computed: {
        avatarStyle() {
            if (this.avatarImage) {
                return {
                    backgroundImage: `url(${this.avatarImage})`,
                    backgroundSize: 'cover'
                };
            }
            return {};
        },
        
        vinylStyle() {
            if (this.vinylImage) {
                return {
                    backgroundImage: `url(${this.vinylImage})`,
                    backgroundSize: 'cover'
                };
            }
            return {};
        },
        
        decoStyle() {
            if (this.decoImage) {
                return {
                    backgroundImage: `url(${this.decoImage})`
                };
            }
            return {};
        },

        timeBoxBgStyle() {
            if (this.timeBgImage) {
                return {
                    backgroundImage: `url(${this.timeBgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                };
            }
            return {};
        },
        
        gridButtons() {
            return [
                { 
                    id: 'grid-qq',
                    icon: '🐧', 
                    label: 'QQ', 
                    action: () => this.$emit('open-qq'),
                    iconImage: this.appIcons['grid-qq']
                },
                { 
                    id: 'grid-preset',
                    icon: '⚙️', 
                    label: '预设', 
                    action: this.onShowPreset || null,
                    iconImage: this.appIcons['grid-preset']
                },
                { 
                    id: 'grid-world',
                    icon: '🌍', 
                    label: '世界书', 
                    action: this.onShowWorldBook || null,
                    iconImage: this.appIcons['grid-world']
                },
                { 
                    id: 'grid-appearance',
                    icon: '🎨', 
                    label: '外观', 
                    action: this.onShowAppearance,
                    iconImage: this.appIcons['grid-appearance'] || this.customIcon
                }
            ];
        },
        
        dockItems() {
            return [
                { 
                    id: 'dock-api',
                    icon: '🔌', 
                    label: 'API设置', 
                    action: this.onShowSettings,
                    iconImage: this.appIcons['dock-api']
                },
                { 
                    id: 'dock-font',
                    icon: 'Aa', 
                    label: '字体', 
                    action: this.onShowFontSettings,
                    iconImage: this.appIcons['dock-font']
                },
                { 
                    id: 'dock-forum',
                    icon: '💬', 
                    label: '论坛', 
                    action: this.onShowForum || null,
                    iconImage: this.appIcons['dock-forum']
                }
            ];
        }
    },
    
    methods: {
        updateTime() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            this.timeDisplay = `${hours}:${minutes}`;

            const month = now.getMonth() + 1;
            const date = now.getDate();
            const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            const dayName = days[now.getDay()];
            this.dateDisplay = `${month}月${date}日 ${dayName}`;
        },
        
        editContent(field) {
            const fieldNames = {
                greeting: '问候语',
                subtitle: '副标题',
                profileText: '个人资料文字'
            };
            const originalText = this[field];
            const newText = prompt(`请输入新的${fieldNames[field]}：`, originalText);
            if (newText !== null && newText.trim() !== '') {
                this[field] = newText;
                this.saveSettings();
            }
        },
        
        triggerUpload(type) {
            this.$emit('upload', type);
        },

        handleTimeDecoAreaClick() {
            // 默认：没图 -> 点击区域 B 上传
            if (!this.timeDecoImage) {
                this.showTimeDecoRemove = false;
                this.triggerUpload('timeDeco');
                return;
            }

            // 上传后：再次点击区域 B -> 显示/隐藏右上角叉
            this.showTimeDecoRemove = !this.showTimeDecoRemove;
        },

        removeTimeDeco() {
            this.timeDecoImage = null;
            this.showTimeDecoRemove = false;
            this.saveSettings();
        },
        
        setImage(type, dataUrl) {
            switch (type) {
                case 'avatar':
                    this.avatarImage = dataUrl;
                    break;
                case 'vinyl':
                    this.vinylImage = dataUrl;
                    break;
                case 'deco':
                    this.decoImage = dataUrl;
                    break;

                // 第一部分时间框：双层图片
                case 'timeBg':
                    this.timeBgImage = dataUrl;
                    break;
                case 'timeDeco':
                    this.timeDecoImage = dataUrl;
                    this.showTimeDecoRemove = false;
                    break;
            }
            this.saveSettings();
        },
        
        toggleMusic() {
            this.isPlaying = !this.isPlaying;
        },

        saveSettings() {
            const settings = {
                greeting: this.greeting,
                subtitle: this.subtitle,
                profileText: this.profileText,
                avatarImage: this.avatarImage,
                vinylImage: this.vinylImage,
                decoImage: this.decoImage,
                timeBgImage: this.timeBgImage,
                timeDecoImage: this.timeDecoImage
            };
            localStorage.setItem('homePageSettings', JSON.stringify(settings));
        },

        loadSettings() {
            // 加载常规设置
            const saved = localStorage.getItem('homePageSettings');
            if (saved) {
                try {
                    const settings = JSON.parse(saved);
                    if (settings.greeting) this.greeting = settings.greeting;
                    if (settings.subtitle) this.subtitle = settings.subtitle;
                    if (settings.profileText) this.profileText = settings.profileText;
                    if (settings.avatarImage) this.avatarImage = settings.avatarImage;
                    if (settings.vinylImage) this.vinylImage = settings.vinylImage;
                    if (settings.decoImage) this.decoImage = settings.decoImage;
                    if (settings.timeBgImage) this.timeBgImage = settings.timeBgImage;
                    if (settings.timeDecoImage) this.timeDecoImage = settings.timeDecoImage;
                } catch (e) {
                    console.error('加载主页设置失败:', e);
                }
            }
            
            // 加载时间显示设置（从AppearancePage保存的设置中读取）
            const savedHideTime = localStorage.getItem('hideTime');
            this.hideTime = savedHideTime === 'true';
            
            const savedTimeColor = localStorage.getItem('timeColor');
            if (savedTimeColor) {
                this.timeColor = savedTimeColor;
            }
        }
    },
    
    mounted() {
        this.loadSettings();
        this.updateTime();
        this.timeInterval = setInterval(this.updateTime, 1000);
    },
    
    beforeUnmount() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    }
};
