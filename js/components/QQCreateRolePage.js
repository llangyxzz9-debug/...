// QQ 创建角色页面
export const QQCreateRolePage = {
    template: `
        <div class="qq-create-role">
            <div class="qq-header">
                <div class="qq-header-left" @click="onBack && onBack()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </div>
                <div class="qq-title">创建角色</div>
                <div class="qq-header-actions"></div>
            </div>

            <div class="qq-create-body">
                <div class="qq-form">
                    <label class="qq-form-label">姓名</label>
                    <input class="qq-form-input" v-model="name" placeholder="例如：小明 / Alice" />

                    <label class="qq-form-label">设定</label>
                    <textarea class="qq-form-textarea" v-model="setting" placeholder="例如：性格、背景、说话风格…"></textarea>

                    <label class="qq-form-label">头像 URL（可选）</label>
                    <input class="qq-form-input" v-model="avatar" placeholder="https://..." />

                    <button class="qq-primary-btn" @click="submit">创建</button>
                </div>
            </div>
        </div>
    `,
    props: {
        onBack: Function,
        onCreate: Function
    },
    data() {
        return {
            name: '',
            setting: '',
            avatar: ''
        };
    },
    methods: {
        submit() {
            const name = (this.name || '').trim();
            if (!name) return;

            const role = {
                id: `role_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                name,
                setting: (this.setting || '').trim(),
                avatar: (this.avatar || '').trim(),
                worldBookIds: []
            };

            if (this.onCreate) this.onCreate(role);
        }
    }
};
