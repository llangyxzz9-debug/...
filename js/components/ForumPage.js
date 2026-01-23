// 简约可爱风格论坛页面
export const ForumPage = {
    template: `
        <div class="cute-forum">
            <!-- 顶部导航 -->
            <div class="cute-forum-header">
                <button class="cute-back-btn" @click="goBack">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                </button>
                <div class="cute-forum-title">
                    <span class="cute-title-icon">🌸</span>
                    <span class="cute-title-text">小窝论坛</span>
                </div>
                <button class="cute-write-btn" @click="showCompose = true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                </button>
            </div>

            <!-- 分类标签 -->
            <div class="cute-tags-wrap">
                <div class="cute-tags-scroll">
                    <button 
                        class="cute-tag-btn"
                        :class="{ active: activeTag === '全部' }"
                        @click="activeTag = '全部'"
                    >✨ 全部</button>
                    <button 
                        v-for="tag in tags" 
                        :key="tag.name"
                        class="cute-tag-btn"
                        :class="{ active: activeTag === tag.name }"
                        @click="activeTag = tag.name"
                    >{{ tag.icon }} {{ tag.name }}</button>
                </div>
            </div>

            <!-- 帖子列表 -->
            <div class="cute-posts-list">
                <div v-if="filteredPosts.length === 0" class="cute-empty">
                    <div class="cute-empty-icon">🐰</div>
                    <div class="cute-empty-text">还没有帖子呢~</div>
                    <div class="cute-empty-sub">快来发布第一条吧！</div>
                </div>

                <div 
                    v-for="post in filteredPosts" 
                    :key="post.id" 
                    class="cute-post-card"
                    @click="viewPost(post)"
                >
                    <!-- 帖子头部 -->
                    <div class="cute-post-header">
                        <div class="cute-post-avatar" :style="getAvatarStyle(post.avatar)">
                            {{ post.avatar ? '' : post.author.charAt(0) }}
                        </div>
                        <div class="cute-post-info">
                            <div class="cute-post-author">{{ post.author }}</div>
                            <div class="cute-post-time">{{ post.time }}</div>
                        </div>
                        <div v-if="post.badge" class="cute-post-badge" :class="post.badgeType">
                            {{ post.badge }}
                        </div>
                    </div>

                    <!-- 帖子内容 -->
                    <div class="cute-post-body">
                        <div class="cute-post-title">{{ post.title }}</div>
                        <div class="cute-post-excerpt">{{ post.excerpt }}</div>
                    </div>

                    <!-- 帖子图片 -->
                    <div v-if="post.images && post.images.length" class="cute-post-images">
                        <div 
                            v-for="(img, idx) in post.images.slice(0, 3)" 
                            :key="idx"
                            class="cute-post-img"
                            :style="{ backgroundImage: 'url(' + img + ')' }"
                        ></div>
                    </div>

                    <!-- 帖子底部 -->
                    <div class="cute-post-footer">
                        <div class="cute-post-tags">
                            <span v-for="t in post.tags" :key="t" class="cute-mini-tag">{{ t }}</span>
                        </div>
                        <div class="cute-post-stats">
                            <span class="cute-stat">💬 {{ post.comments }}</span>
                            <span class="cute-stat">💗 {{ post.likes }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 发帖弹窗 -->
            <div v-if="showCompose" class="cute-modal-mask" @click.self="showCompose = false">
                <div class="cute-modal">
                    <div class="cute-modal-header">
                        <span class="cute-modal-title">🌷 发布新帖子</span>
                        <button class="cute-modal-close" @click="showCompose = false">×</button>
                    </div>
                    <div class="cute-modal-body">
                        <input 
                            type="text" 
                            class="cute-input" 
                            v-model="newPost.title" 
                            placeholder="给帖子起个标题吧~"
                        >
                        <textarea 
                            class="cute-textarea" 
                            v-model="newPost.content" 
                            placeholder="分享你的想法..."
                            rows="4"
                        ></textarea>
                        <div class="cute-tag-select">
                            <span class="cute-tag-label">选择分类：</span>
                            <div class="cute-tag-options">
                                <button 
                                    v-for="tag in tags" 
                                    :key="tag.name"
                                    class="cute-tag-option"
                                    :class="{ selected: newPost.tag === tag.name }"
                                    @click="newPost.tag = tag.name"
                                >{{ tag.icon }} {{ tag.name }}</button>
                            </div>
                        </div>
                    </div>
                    <div class="cute-modal-footer">
                        <button class="cute-btn cute-btn-cancel" @click="showCompose = false">取消</button>
                        <button class="cute-btn cute-btn-submit" @click="submitPost">发布 ✨</button>
                    </div>
                </div>
            </div>

            <!-- 帖子详情弹窗 -->
            <div v-if="selectedPost" class="cute-modal-mask" @click.self="selectedPost = null">
                <div class="cute-modal cute-modal-detail">
                    <div class="cute-modal-header">
                        <span class="cute-modal-title">📖 帖子详情</span>
                        <button class="cute-modal-close" @click="selectedPost = null">×</button>
                    </div>
                    <div class="cute-modal-body cute-detail-body">
                        <!-- 作者信息 -->
                        <div class="cute-detail-author">
                            <div class="cute-post-avatar" :style="getAvatarStyle(selectedPost.avatar)">
                                {{ selectedPost.avatar ? '' : selectedPost.author.charAt(0) }}
                            </div>
                            <div class="cute-post-info">
                                <div class="cute-post-author">{{ selectedPost.author }}</div>
                                <div class="cute-post-time">{{ selectedPost.time }}</div>
                            </div>
                        </div>
                        
                        <!-- 帖子内容 -->
                        <div class="cute-detail-title">{{ selectedPost.title }}</div>
                        <div class="cute-detail-content">{{ selectedPost.content || selectedPost.excerpt }}</div>
                        
                        <!-- 评论区 -->
                        <div class="cute-comments-section">
                            <div class="cute-comments-title">💭 评论 ({{ selectedPost.commentList ? selectedPost.commentList.length : 0 }})</div>
                            
                            <div v-if="!selectedPost.commentList || selectedPost.commentList.length === 0" class="cute-no-comments">
                                还没有评论，快来抢沙发~
                            </div>
                            
                            <div v-else class="cute-comments-list">
                                <div v-for="(comment, idx) in selectedPost.commentList" :key="idx" class="cute-comment-item">
                                    <div class="cute-comment-avatar">{{ comment.author.charAt(0) }}</div>
                                    <div class="cute-comment-content">
                                        <div class="cute-comment-author">{{ comment.author }}</div>
                                        <div class="cute-comment-text">{{ comment.text }}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 发评论 -->
                            <div class="cute-comment-input-wrap">
                                <input 
                                    type="text" 
                                    class="cute-comment-input" 
                                    v-model="newComment" 
                                    placeholder="说点什么..."
                                    @keyup.enter="submitComment"
                                >
                                <button class="cute-comment-send" @click="submitComment">发送</button>
                            </div>
                        </div>
                    </div>
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
            activeTag: '全部',
            showCompose: false,
            selectedPost: null,
            newComment: '',
            newPost: {
                title: '',
                content: '',
                tag: ''
            },
            tags: [
                { name: '日常', icon: '☀️' },
                { name: '分享', icon: '🎁' },
                { name: '提问', icon: '❓' },
                { name: '灵感', icon: '💡' },
                { name: '安利', icon: '💕' },
                { name: '闲聊', icon: '💬' }
            ],
            posts: [
                {
                    id: 'p1',
                    author: '小棉花',
                    avatar: '',
                    time: '刚刚',
                    badge: '置顶',
                    badgeType: 'top',
                    title: '欢迎来到小窝论坛 🎉',
                    excerpt: '这里是一个温馨的小角落，大家可以在这里分享日常、交流想法，希望大家玩得开心~',
                    content: '这里是一个温馨的小角落，大家可以在这里分享日常、交流想法，希望大家玩得开心~\n\n论坛规则：\n1. 友善交流，互相尊重\n2. 禁止发布不良内容\n3. 有问题可以随时提问哦',
                    tags: ['日常', '分享'],
                    comments: 12,
                    likes: 88,
                    images: [],
                    commentList: [
                        { author: '小云朵', text: '好棒！终于有论坛了~' },
                        { author: '奶茶控', text: '支持支持！' }
                    ]
                },
                {
                    id: 'p2',
                    author: '奶油桃',
                    avatar: '',
                    time: '5分钟前',
                    badge: '热门',
                    badgeType: 'hot',
                    title: '分享一组超可爱的配色 🎨',
                    excerpt: '最近发现了几个超级温柔的配色方案，奶油蓝+薄荷绿，看着就很治愈~',
                    tags: ['分享', '灵感'],
                    comments: 24,
                    likes: 156,
                    images: [],
                    commentList: [
                        { author: '设计喵', text: '好好看！收藏了' },
                        { author: '调色盘', text: '求色号！' }
                    ]
                },
                {
                    id: 'p3',
                    author: '小泡芙',
                    avatar: '',
                    time: '30分钟前',
                    badge: '',
                    badgeType: '',
                    title: '有人一起学画画吗？',
                    excerpt: '想找小伙伴一起学习画画，互相监督打卡，有兴趣的朋友可以留言~',
                    tags: ['提问', '日常'],
                    comments: 8,
                    likes: 32,
                    images: [],
                    commentList: []
                },
                {
                    id: 'p4',
                    author: '软糖',
                    avatar: '',
                    time: '1小时前',
                    badge: '新',
                    badgeType: 'new',
                    title: '今日份的小确幸 ✨',
                    excerpt: '今天天气超好，阳光透过窗户洒进来，泡了一杯热可可，感觉整个人都暖暖的~',
                    tags: ['日常', '闲聊'],
                    comments: 15,
                    likes: 67,
                    images: [],
                    commentList: [
                        { author: '阳光', text: '好治愈的生活~' }
                    ]
                }
            ]
        };
    },

    computed: {
        filteredPosts() {
            if (this.activeTag === '全部') {
                return this.posts;
            }
            return this.posts.filter(post => post.tags.includes(this.activeTag));
        }
    },

    methods: {
        goBack() {
            this.onBack();
        },

        getAvatarStyle(url) {
            if (url) {
                return {
                    backgroundImage: 'url(' + url + ')',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                };
            }
            return {};
        },

        viewPost(post) {
            this.selectedPost = post;
        },

        submitPost() {
            if (!this.newPost.title.trim()) {
                alert('请输入标题~');
                return;
            }
            if (!this.newPost.content.trim()) {
                alert('请输入内容~');
                return;
            }

            const post = {
                id: 'p' + Date.now(),
                author: '我',
                avatar: '',
                time: '刚刚',
                badge: '新',
                badgeType: 'new',
                title: this.newPost.title,
                excerpt: this.newPost.content.substring(0, 50) + (this.newPost.content.length > 50 ? '...' : ''),
                content: this.newPost.content,
                tags: this.newPost.tag ? [this.newPost.tag] : ['日常'],
                comments: 0,
                likes: 0,
                images: [],
                commentList: []
            };

            this.posts.unshift(post);
            this.newPost = { title: '', content: '', tag: '' };
            this.showCompose = false;
        },

        submitComment() {
            if (!this.newComment.trim() || !this.selectedPost) return;

            if (!this.selectedPost.commentList) {
                this.selectedPost.commentList = [];
            }

            this.selectedPost.commentList.push({
                author: '我',
                text: this.newComment
            });
            this.selectedPost.comments++;
            this.newComment = '';
        }
    }
};
