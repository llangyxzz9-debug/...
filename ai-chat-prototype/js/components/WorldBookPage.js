// 世界书管理页面
export const WorldBookPage = {
    template: `
        <div class="worldbook-page">
            <div class="qq-header">
                <div class="qq-header-left" @click="onBack && onBack()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </div>
                <div class="qq-title">世界书</div>
                <div class="qq-header-actions worldbook-actions">
                    <button class="worldbook-action-btn" @click="triggerImport('new')">导入</button>
                </div>
            </div>

            <div class="worldbook-body">
                <div class="worldbook-shelf">
                    <div class="worldbook-shelf-header">
                        <div class="worldbook-shelf-title">我的世界书</div>
                        <button class="worldbook-mini-btn" @click="createBook">+ 新建</button>
                    </div>

                    <div class="worldbook-list">
                        <div
                            v-for="book in books"
                            :key="book.id"
                            class="worldbook-item"
                            :class="{ active: book.id === activeBookId }"
                            @click="setActiveBook(book.id)"
                        >
                            <div class="worldbook-item-title">{{ book.name || '未命名世界书' }}</div>
                            <div class="worldbook-item-meta">
                                {{ getBookSummary(book) }}
                            </div>
                        </div>

                        <div v-if="books.length === 0" class="worldbook-empty">
                            还没有世界书，点击“新建”开始创建
                        </div>
                    </div>
                </div>

                <div class="worldbook-detail" v-if="activeBook">
                    <div class="worldbook-detail-header">
                        <div class="worldbook-detail-title">
                            <input
                                class="worldbook-title-input"
                                v-model="activeBook.name"
                                @input="schedulePersist"
                                placeholder="世界书名称"
                            />
                            <div class="worldbook-detail-meta">{{ getBookSummary(activeBook) }}</div>
                        </div>
                        <div class="worldbook-detail-actions">
                            <button class="worldbook-mini-btn" @click="addEntry(activeBook)">+ 条目</button>
                            <button class="worldbook-mini-btn" @click="triggerImport('current')" :disabled="!activeBook">导入到此书</button>
                            <button class="worldbook-mini-btn danger" @click="deleteBook(activeBook)">删除</button>
                        </div>
                    </div>

                    <div class="worldbook-entries">
                        <div
                            v-for="entry in activeBook.entries"
                            :key="entry.id"
                            class="worldbook-entry"
                        >
                            <div class="worldbook-entry-top">
                                <input
                                    class="worldbook-entry-name"
                                    v-model="entry.name"
                                    @input="schedulePersist"
                                    placeholder="条目名称"
                                />
                                <div class="worldbook-entry-flags">
                                    <label class="worldbook-flag">
                                        <input type="checkbox" v-model="entry.enabled" @change="schedulePersist" />
                                        启用
                                    </label>
                                    <label class="worldbook-flag">
                                        <input type="checkbox" v-model="entry.always" @change="schedulePersist" />
                                        常驻
                                    </label>
                                </div>
                            </div>

                            <div class="worldbook-entry-row">
                                <input
                                    class="worldbook-entry-keywords"
                                    v-model="entry.keywordsText"
                                    @input="updateEntryKeywords(entry)"
                                    placeholder="关键词（用逗号分隔）"
                                />
                                <button class="worldbook-mini-btn danger" @click="deleteEntry(activeBook, entry)">删除</button>
                            </div>

                            <textarea
                                class="worldbook-entry-content"
                                v-model="entry.content"
                                @input="schedulePersist"
                                placeholder="条目内容..."
                            ></textarea>
                        </div>

                        <div v-if="activeBook.entries.length === 0" class="worldbook-entry-empty">
                            暂无条目，点击“+ 条目”添加
                        </div>
                    </div>
                </div>

                <div v-else class="worldbook-detail worldbook-detail-empty">
                    请选择或新建一个世界书
                </div>
            </div>

            <input
                ref="importInput"
                class="file-input"
                type="file"
                accept=".json,application/json"
                @change="handleImportFile"
            />
        </div>
    `,
    props: {
        onBack: Function,
        worldBooks: {
            type: Array,
            default: () => []
        },
        onUpdateWorldBooks: Function
    },
    data() {
        return {
            books: [],
            activeBookId: null,
            importMode: 'new',
            persistTimer: null,
            suspendSync: false
        };
    },
    computed: {
        activeBook() {
            return this.books.find((b) => b.id === this.activeBookId) || null;
        }
    },
    watch: {
        worldBooks: {
            immediate: true,
            handler(newVal) {
                if (this.suspendSync) {
                    this.suspendSync = false;
                    return;
                }
                this.books = this.normalizeBooksForEdit(newVal || []);
                if (!this.activeBookId && this.books.length) {
                    this.activeBookId = this.books[0].id;
                }
                if (this.activeBookId && !this.books.find(b => b.id === this.activeBookId)) {
                    this.activeBookId = this.books[0]?.id || null;
                }
            }
        }
    },
    methods: {
        normalizeBooksForEdit(books) {
            return (books || []).map((book) => ({
                ...book,
                defaultGroupId: (book.groups && book.groups[0]?.id) || book.defaultGroupId || `wbg_${book.id || Date.now()}`,
                entries: (book.entries || (book.groups || []).flatMap(g => g.entries || [])).map((entry) => ({
                    ...entry,
                    enabled: entry.enabled !== false,
                    always: !!entry.always,
                    keywordsText: Array.isArray(entry.keywords) ? entry.keywords.join(', ') : ''
                }))
            }));
        },
        schedulePersist() {
            if (this.persistTimer) clearTimeout(this.persistTimer);
            this.persistTimer = setTimeout(() => {
                this.persistTimer = null;
                this.persistBooks();
            }, 120);
        },
        persistBooks() {
            if (!this.onUpdateWorldBooks) return;
            const sanitized = this.sanitizeBooks(this.books);
            this.suspendSync = true;
            this.onUpdateWorldBooks(sanitized);
        },
        sanitizeBooks(books) {
            return (books || []).map((book) => ({
                id: book.id,
                name: (book.name || '').trim() || '未命名世界书',
                createdAt: book.createdAt || Date.now(),
                groups: [{
                    id: book.defaultGroupId || `wbg_${book.id || Date.now()}`,
                    name: '默认分组',
                    entries: (book.entries || []).map((entry) => ({
                        id: entry.id,
                        name: (entry.name || '').trim() || '未命名条目',
                        keywords: this.parseKeywords(entry.keywordsText || entry.keywords || []),
                        content: (entry.content || '').trim(),
                        enabled: entry.enabled !== false,
                        always: !!entry.always
                    }))
                }]
            }));
        },
        parseKeywords(value) {
            if (Array.isArray(value)) {
                return value.map(v => String(v).trim()).filter(Boolean);
            }
            if (typeof value !== 'string') return [];
            return value
                .split(',')
                .map(v => v.trim())
                .filter(Boolean);
        },
        getBookSummary(book) {
            const entries = Array.isArray(book.entries) ? book.entries.length : (book.groups || []).reduce((sum, g) => sum + (g.entries || []).length, 0);
            return `${entries} 条目`;
        },
        setActiveBook(bookId) {
            this.activeBookId = bookId;
        },
        createBook() {
            const name = prompt('请输入世界书名称：', '新世界书');
            if (name === null) return;
            const book = {
                id: `wb_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                name: name.trim() || '新世界书',
                createdAt: Date.now(),
                defaultGroupId: `wbg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                entries: []
            };
            this.books = [book, ...this.books];
            this.activeBookId = book.id;
            this.persistBooks();
        },
        deleteBook(book) {
            if (!book) return;
            if (!confirm(`确定删除世界书「${book.name}」吗？`)) return;
            this.books = this.books.filter(b => b.id !== book.id);
            if (this.activeBookId === book.id) {
                this.activeBookId = this.books[0]?.id || null;
            }
            this.persistBooks();
        },
        addEntry(book) {
            if (!book) return;
            book.entries = book.entries || [];
            book.entries.push({
                id: `wbe_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                name: '',
                keywords: [],
                keywordsText: '',
                content: '',
                enabled: true,
                always: false
            });
            this.schedulePersist();
        },
        deleteEntry(book, entry) {
            if (!book || !entry) return;
            book.entries = (book.entries || []).filter(e => e.id !== entry.id);
            this.schedulePersist();
        },
        updateEntryKeywords(entry) {
            entry.keywords = this.parseKeywords(entry.keywordsText || '');
            this.schedulePersist();
        },
        triggerImport(mode) {
            this.importMode = mode === 'current' ? 'current' : 'new';
            this.$refs.importInput?.click();
        },
        handleImportFile(event) {
            const file = event.target.files[0];
            if (!file) return;
            const fileName = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const raw = JSON.parse(e.target.result);
                    const importedBooks = this.normalizeBooksForEdit(this.parseImportedBooks(raw, fileName));
                    if (!importedBooks.length) {
                        alert('未识别到可导入的世界书内容');
                        return;
                    }
                    if (this.importMode === 'current' && this.activeBook) {
                        this.mergeBooksIntoCurrent(this.activeBook, importedBooks);
                    } else {
                        this.books = [...importedBooks, ...this.books];
                        this.activeBookId = importedBooks[0].id;
                        this.persistBooks();
                    }
                } catch (err) {
                    console.error('世界书导入失败:', err);
                    alert('导入失败，请检查文件格式');
                } finally {
                    event.target.value = '';
                }
            };
            reader.readAsText(file);
        },
        mergeBooksIntoCurrent(targetBook, importedBooks) {
            if (!targetBook) return;
            const incomingEntries = importedBooks.flatMap(b => b.entries || []);
            targetBook.entries = [...(targetBook.entries || []), ...incomingEntries];
            this.schedulePersist();
        },
        parseImportedBooks(raw, fileName) {
            const books = [];
            const list = this.normalizeImportPayload(raw);
            list.forEach((payload, index) => {
                const name = this.resolveBookName(payload, index, fileName);
                const entries = this.extractEntries(payload);
                if (!entries.length) return;
                const book = this.buildBookFromEntries(name, entries);
                books.push(book);
            });
            return books;
        },
        normalizeImportPayload(raw) {
            if (Array.isArray(raw)) return raw;
            if (raw?.lorebook?.entries) return [raw.lorebook];
            if (raw?.worldbook?.entries) return [raw.worldbook];
            if (raw && Array.isArray(raw.books)) return raw.books;
            if (raw?.lorebook && Array.isArray(raw.lorebook)) return raw.lorebook;
            if (raw && raw.entries) return [raw];
            if (raw && raw.world_books) return Array.isArray(raw.world_books) ? raw.world_books : [raw.world_books];
            return raw ? [raw] : [];
        },
        extractEntries(payload) {
            if (!payload) return [];
            const rawEntries = payload.entries || payload.lorebook || payload.worldbook || payload.data || [];
            if (rawEntries && rawEntries.entries) {
                return Array.isArray(rawEntries.entries) ? rawEntries.entries : Object.values(rawEntries.entries || {});
            }
            if (Array.isArray(rawEntries)) return rawEntries;
            if (typeof rawEntries === 'object') return Object.values(rawEntries);
            return [];
        },
        resolveBookName(payload, index, fileName) {
            const name =
                payload?.name ||
                payload?.book ||
                payload?.title ||
                payload?.label ||
                payload?.general?.name ||
                payload?.metadata?.name ||
                payload?.meta?.name ||
                payload?.settings?.name ||
                payload?.options?.name ||
                payload?.lorebook?.name ||
                payload?.lorebook?.settings?.name ||
                payload?.lorebook?.label ||
                payload?.worldbook?.name ||
                payload?.worldbook?.settings?.name;
            if (name && String(name).trim()) return String(name).trim();
            if (fileName) {
                const stripped = fileName.replace(/\.[^/.]+$/, '').trim();
                if (stripped) return stripped;
                return fileName;
            }
            return `导入世界书 ${index + 1}`;
        },
        buildBookFromEntries(name, rawEntries) {
            const groupMap = new Map();
            rawEntries.forEach((entry) => {
                if (!entry) return;
                const keywords = this.parseKeywords(
                    entry.keys || entry.key || entry.keywords || entry.keyword || entry.trigger || []
                );
                const content = (entry.content || entry.text || entry.value || '').trim();
                if (!content && !keywords.length) return;
                const groupName = (entry.group || entry.groupName || entry.category || '默认分组').trim() || '默认分组';
                const entryName = (entry.comment || entry.title || entry.name || keywords[0] || '导入条目').trim();
                const enabled = entry.enabled !== undefined ? !!entry.enabled : (entry.disable ? false : true);
                const always = !!(entry.constant || entry.always);

                const entryModel = {
                    id: `wbe_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                    name: entryName,
                    keywords,
                    keywordsText: keywords.join(', '),
                    content,
                    enabled,
                    always
                };

                if (!groupMap.has(groupName)) {
                    groupMap.set(groupName, {
                        id: `wbg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                        name: groupName,
                        entries: []
                    });
                }
                groupMap.get(groupName).entries.push(entryModel);
            });

            return {
                id: `wb_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                name: name || '导入世界书',
                createdAt: Date.now(),
                groups: Array.from(groupMap.values())
            };
        }
    }
};
