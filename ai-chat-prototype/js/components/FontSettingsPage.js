// 字体设置页面组件
export const FontSettingsPage = {
    template: `
        <div class="settings-page font-settings-page">
            <div class="settings-header">
                <button class="back-btn" @click="onBack">←</button>
                <h2>字体设置</h2>
            </div>
            
            <div class="settings-content">
                <div class="setting-item">
                    <label>全局字体 URL</label>
                    <div class="input-group">
                        <input 
                            type="text" 
                            v-model="fontUrl" 
                            placeholder="请输入字体文件 URL (例如: .woff2, .ttf)"
                            class="font-url-input"
                        >
                    </div>
                    <p class="setting-desc">输入在线字体链接，点击保存后将应用到全局。</p>
                </div>
                
                <div class="preview-area" :style="{ fontFamily: previewFontFamily }">
                    <h3>字体预览</h3>
                    <p>这是一段示例文本。1234567890</p>
                    <p>The quick brown fox jumps over the lazy dog.</p>
                </div>
                
                <div class="action-buttons">
                    <button class="save-btn" @click="saveFont">保存并应用</button>
                    <button class="reset-btn" @click="resetFont">恢复默认</button>
                </div>
            </div>
        </div>
    `,
    
    props: {
        onBack: {
            type: Function,
            required: true
        }
    },
    
    data() {
        return {
            fontUrl: '',
            currentFontFamily: 'inherit'
        };
    },
    
    computed: {
        previewFontFamily() {
            return this.fontUrl ? 'CustomFontPreview' : 'inherit';
        }
    },
    
    methods: {
        loadSettings() {
            const savedUrl = localStorage.getItem('customFontUrl');
            if (savedUrl) {
                this.fontUrl = savedUrl;
            }
        },
        
        saveFont() {
            if (!this.fontUrl) {
                alert('请输入字体 URL');
                return;
            }
            
            // 保存到本地存储
            localStorage.setItem('customFontUrl', this.fontUrl);
            
            // 触发全局字体更新事件
            this.$emit('font-updated', this.fontUrl);
            
            alert('字体已保存并应用');
        },
        
        resetFont() {
            this.fontUrl = '';
            localStorage.removeItem('customFontUrl');
            this.$emit('font-reset');
            alert('已恢复默认字体');
        }
    },
    
    mounted() {
        this.loadSettings();
    }
};
