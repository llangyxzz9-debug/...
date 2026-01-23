// API 设置页面组件
export const SettingsPage = {
    template: `
        <div class="settings-page">
            <div class="settings-header">
                <button class="back-btn" @click="goBack">←</button>
                <span class="settings-title">API 连接设置</span>
            </div>

            <div class="settings-content">
                <div class="form-group">
                    <label class="form-label">API 配置方案</label>
                    <select class="form-input" v-model="selectedProfileId" @change="selectProfile">
                        <option value="" disabled>请选择方案</option>
                        <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
                            {{ profile.name }}
                        </option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">方案名称</label>
                    <input 
                        type="text" 
                        class="form-input" 
                        v-model="profileName"
                        placeholder="例如：默认方案"
                    >
                </div>

                <div class="form-group form-actions">
                    <button class="btn-secondary" @click="saveAsNewProfile">保存为新方案</button>
                    <button class="btn-secondary danger" @click="deleteCurrentProfile">删除方案</button>
                </div>

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

                <div class="form-group">
                    <label class="form-label">最大输出长度 (Max Tokens)</label>
                    <input 
                        type="number" 
                        class="form-input" 
                        v-model.number="settings.maxTokens"
                        placeholder="8192"
                        min="256"
                        max="128000"
                    >
                    <div class="form-hint">控制模型单次回复的最大 token 数，推理模型建议设置较大值</div>
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
                temperature: 0.7,
                maxTokens: 8192
            },
            profileName: '',
            profiles: [],
            selectedProfileId: '',
            modelList: [],
            isFetching: false,
            fetchButtonText: '拉取'
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
        
        persistProfiles() {
            localStorage.setItem('apiProfiles', JSON.stringify(this.profiles));
            localStorage.setItem('apiActiveProfileId', this.selectedProfileId || '');
        },

        applySettings(payload) {
            this.settings.baseUrl = payload.baseUrl || '';
            this.settings.apiKey = payload.apiKey || '';
            // 兼容旧字段 model/model_id
            this.settings.modelName = payload.modelName || payload.model || payload.model_id || '';
            this.settings.temperature = typeof payload.temperature === 'number' ? payload.temperature : 0.7;
            this.settings.maxTokens = typeof payload.maxTokens === 'number' ? payload.maxTokens : 8192;
        },

        syncActiveSettings() {
            const settingsData = {
                baseUrl: this.settings.baseUrl,
                apiKey: this.settings.apiKey,
                modelName: this.settings.modelName,
                // 兼容旧字段
                model: this.settings.modelName,
                temperature: this.settings.temperature,
                maxTokens: this.settings.maxTokens
            };
            localStorage.setItem('apiSettings', JSON.stringify(settingsData));
        },

        selectProfile() {
            const profile = this.profiles.find((p) => p.id === this.selectedProfileId);
            if (!profile) return;
            this.profileName = profile.name || '';
            this.applySettings(profile);
            this.syncActiveSettings();
            this.persistProfiles();
        },

        saveAsNewProfile() {
            const name = (this.profileName || '').trim() || `方案 ${this.profiles.length + 1}`;
            const existing = this.profiles.find((p) => p.name === name);
            if (existing) {
                const overwrite = confirm(`已存在名为「${name}」的方案，是否覆盖？`);
                if (overwrite) {
                    existing.baseUrl = this.settings.baseUrl;
                    existing.apiKey = this.settings.apiKey;
                    existing.modelName = this.settings.modelName;
                    existing.temperature = this.settings.temperature;
                    existing.maxTokens = this.settings.maxTokens;
                    this.selectedProfileId = existing.id;
                    this.persistProfiles();
                    this.syncActiveSettings();
                    return;
                }
            }

            const suffix = existing ? ` (${this.profiles.length + 1})` : '';
            const finalName = `${name}${suffix}`;
            const id = `profile_${Date.now()}_${Math.random().toString(16).slice(2)}`;
            const profile = {
                id,
                name: finalName,
                baseUrl: this.settings.baseUrl,
                apiKey: this.settings.apiKey,
                modelName: this.settings.modelName,
                temperature: this.settings.temperature,
                maxTokens: this.settings.maxTokens
            };
            this.profiles = [profile, ...this.profiles];
            this.selectedProfileId = id;
            this.profileName = finalName;
            this.persistProfiles();
            this.syncActiveSettings();
        },

        deleteCurrentProfile() {
            if (!this.selectedProfileId) {
                alert('请选择要删除的方案');
                return;
            }
            if (!confirm('确定要删除当前方案吗？')) return;
            this.profiles = this.profiles.filter((p) => p.id !== this.selectedProfileId);
            this.selectedProfileId = this.profiles[0]?.id || '';
            if (this.selectedProfileId) {
                this.selectProfile();
            } else {
                this.profileName = '';
                this.syncActiveSettings();
                this.persistProfiles();
            }
        },

        loadSettings() {
            const savedProfiles = localStorage.getItem('apiProfiles');
            const savedActive = localStorage.getItem('apiActiveProfileId');
            if (savedProfiles) {
                try {
                    this.profiles = JSON.parse(savedProfiles) || [];
                } catch (e) {
                    console.error('Failed to load profiles:', e);
                }
            }
            if (savedActive) {
                this.selectedProfileId = savedActive;
            }
            if (this.selectedProfileId) {
                this.selectProfile();
                return;
            }
            if (this.profiles.length) {
                this.selectedProfileId = this.profiles[0].id;
                this.selectProfile();
                return;
            }
            const saved = localStorage.getItem('apiSettings');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    this.applySettings(data || {});
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
