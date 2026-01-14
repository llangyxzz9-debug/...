// API 设置页面组件
export const SettingsPage = {
    template: `
        <div class="settings-page">
            <div class="settings-header">
                <button class="back-btn" @click="goBack">←</button>
                <span class="settings-title">API 连接设置</span>
            </div>

            <div class="settings-content">
                <!-- 连接配置 -->
                <div class="form-group">
                    <label class="form-label">Base URL</label>
                    <input 
                        type="text" 
                        class="form-input" 
                        v-model="settings.baseUrl"
                        placeholder="https://api.openai.com/v1"
                    >
                </div>

                <div class="form-group">
                    <label class="form-label">API Key</label>
                    <input 
                        type="password" 
                        class="form-input" 
                        v-model="settings.apiKey"
                        placeholder="sk-..."
                    >
                </div>

                <div class="form-group">
                    <label class="form-label">模型名称</label>
                    <div class="input-group">
                        <select 
                            class="form-input" 
                            v-model="settings.modelName"
                        >
                            <option value="" disabled>请选择或拉取模型</option>
                            <option 
                                v-if="settings.modelName && !modelList.some(m => m.id === settings.modelName)" 
                                :value="settings.modelName"
                            >
                                {{ settings.modelName }}
                            </option>
                            <option v-for="model in modelList" :key="model.id" :value="model.id">
                                {{ model.id }}
                            </option>
                        </select>
                        <button class="btn-secondary" @click="fetchModels" :disabled="isFetching">
                            {{ fetchButtonText }}
                        </button>
                    </div>
                </div>

                <!-- 模型参数 -->
                <div class="form-group">
                    <label class="form-label">温度 (Temperature)</label>
                    <div class="slider-container">
                        <input 
                            type="range" 
                            min="0" 
                            max="2" 
                            step="0.1" 
                            v-model="settings.temperature"
                            class="slider"
                        >
                        <span class="slider-value">{{ settings.temperature }}</span>
                    </div>
                </div>

                <!-- 操作区域 -->
                <div style="margin-top: auto;">
                    <button 
                        class="btn-primary" 
                        style="width: 100%;" 
                        :style="saveButtonStyle"
                        @click="saveSettings"
                    >
                        {{ saveButtonText }}
                    </button>
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
            settings: {
                baseUrl: '',
                apiKey: '',
                modelName: '',
                temperature: 0.7
            },
            modelList: [],
            isFetching: false,
            fetchButtonText: '拉取',
            saveButtonText: '保存配置',
            saveButtonStyle: {}
        };
    },
    
    methods: {
        goBack() {
            this.onBack();
        },
        
        async fetchModels() {
            if (!this.settings.baseUrl || !this.settings.apiKey) {
                alert('请先填写 Base URL 和 API Key');
                return;
            }

            this.isFetching = true;
            this.fetchButtonText = '拉取中...';
            
            try {
                // 去除末尾斜杠
                let url = this.settings.baseUrl.replace(/\/+$/, '');
                
                const response = await fetch(`${url}/models`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.settings.apiKey}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                
                if (data && Array.isArray(data.data)) {
                    this.modelList = data.data;
                    this.fetchButtonText = '成功!';
                    
                    // 如果当前没有选择模型，或者列表不为空且当前模型为空，默认选第一个
                    if (!this.settings.modelName && this.modelList.length > 0) {
                        this.settings.modelName = this.modelList[0].id;
                    }
                } else {
                    throw new Error('返回数据格式异常');
                }
            } catch (e) {
                console.error(e);
                alert(`拉取模型失败: ${e.message}`);
                this.fetchButtonText = '重试';
            } finally {
                this.isFetching = false;
                setTimeout(() => {
                    if (this.fetchButtonText === '成功!') {
                        this.fetchButtonText = '拉取';
                    }
                }, 2000);
            }
        },
        
        async saveSettings() {
            // 保存设置到 localStorage
            const settingsData = {
                baseUrl: this.settings.baseUrl,
                apiKey: this.settings.apiKey,
                modelName: this.settings.modelName,
                temperature: this.settings.temperature
            };
            
            localStorage.setItem('apiSettings', JSON.stringify(settingsData));
            
            console.log('Saving settings:', settingsData);
            
            this.saveButtonText = '已保存';
            this.saveButtonStyle = { backgroundColor: '#4cd964' };
            
            setTimeout(() => {
                this.saveButtonText = '保存配置';
                this.saveButtonStyle = {};
            }, 1500);
        },
        
        loadSettings() {
            const saved = localStorage.getItem('apiSettings');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    this.settings.baseUrl = data.baseUrl || '';
                    this.settings.apiKey = data.apiKey || '';
                    this.settings.modelName = data.modelName || '';
                    this.settings.temperature = data.temperature || 0.7;
                } catch (e) {
                    console.error('Failed to load settings:', e);
                }
            }
        }
    },
    
    mounted() {
        this.loadSettings();
    }
};
