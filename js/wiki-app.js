/**
 * Wiki 主应用
 * =========================================
 * 整合主题、Markdown、路由模块
 * 实现:
 * - 导航结构扫描与生成
 * - 全站全文搜索
 * - 响应式抽屉 (侧边栏)
 * - 键盘快捷键
 * - PWA 离线支持
 */
class WikiApp {
    constructor() {
        this.pages = [];           // 所有页面列表
        this.groups = [];          // 分组配置 (从 groups.json 加载)
        this.searchIndex = [];     // 搜索索引
        this.initPromise = null;
    }

    /**
     * 启动应用
     */
    async init() {
        console.log('[WikiApp] 启动中...');

        // 1. 初始化路由
        wikiRouter.init();

        // 2. 加载分组配置
        await this.loadGroups();

        // 3. 扫描所有页面
        await this.scanPages();

        // 4. 构建导航
        this.buildNavigation();

        // 4. 初始化搜索
        this.initSearch();

        // 5. 初始化菜单切换
        this.initDrawer();

        // 6. 初始化主题切换
        this.initThemeToggle();

        // 7. 初始化键盘快捷键
        this.initKeyboard();

        // 8. 监听主题变化时重建搜索索引中的 HTML
        document.addEventListener('themechange', () => {
            // 搜索索引需要重建因为高亮颜色可能变化
            // 但内容不变，所以只需重建索引中的 HTML 片段
        });

        // 9. 导航到当前页面
        const initialPath = wikiRouter.getHash();
        await wikiRouter.navigate(initialPath);

        console.log(`[WikiApp] 启动完成 | ${this.pages.length} 个页面`);
    }

    /**
     * 从 content/pages.json 加载页面列表
     */
    async scanPages() {
        try {
            const response = await fetch('content/pages.json');
            if (response.ok) {
                this.pages = await response.json();
                console.log(`[WikiApp] 从 pages.json 加载了 ${this.pages.length} 个页面`);
                return;
            }
            throw new Error('pages.json 加载失败');
        } catch (e) {
            console.warn('[WikiApp] 无法加载 pages.json:', e.message);
            this.pages = [];
        }

        console.log(`[WikiApp] 扫描到 ${this.pages.length} 个页面`);
    }

    /**
     * 从 content/groups.json 加载分组配置
     */
    async loadGroups() {
        try {
            const response = await fetch('content/groups.json');
            if (response.ok) {
                this.groups = await response.json();
                console.log(`[WikiApp] 从 groups.json 加载了 ${this.groups.length} 个分组`);
                return;
            }
            throw new Error('groups.json 加载失败');
        } catch (e) {
            console.warn('[WikiApp] 无法加载 groups.json:', e.message);
            this.groups = [];
        }
    }

    /**
     * 获取分组信息，若未定义则归为"其他"
     */
    getCategoryInfo(category) {
        const found = this.groups.find(g => g.key === category);
        return found || { key: 'other', label: '其他', icon: '' };
    }

    /**
     * 构建侧边栏导航 (按分类分组)
     */
    buildNavigation() {
        const navList = document.getElementById('nav-list');
        const pageList = document.getElementById('page-list');
        if (!navList || !pageList) return;

        // 按 category 分组 (使用 groups.json 定义的顺序)
        const groups = new Map();
        for (const page of this.pages) {
            const cat = page.category || 'other';
            if (!groups.has(cat)) groups.set(cat, []);
            groups.get(cat).push(page);
        }

        // 按 groups.json 中的数组顺序排列
        const processedKeys = new Set();
        const sortedGroups = [];
        for (const groupDef of this.groups) {
            if (groups.has(groupDef.key)) {
                sortedGroups.push([groupDef.key, groups.get(groupDef.key)]);
                processedKeys.add(groupDef.key);
            }
        }
        // 未在 groups.json 中定义的按字母序追加
        for (const [key, pages] of groups) {
            if (!processedKeys.has(key)) {
                sortedGroups.push([key, pages]);
            }
        }

        // 生成导航 HTML
        let navHtml = '';
        let pageHtml = '';
        for (const [catKey, catPages] of sortedGroups) {
            const catInfo = this.getCategoryInfo(catKey);
            const isHome = catInfo.isHome === true;
            const sectionClass = isHome ? 'md-drawer__section' : 'md-drawer__section md-drawer__section--category';

            // 首页单独渲染到 nav-list
            if (isHome) {
                navHtml += catPages.map(p => `
                    <li><a href="#/${p.path}">${catInfo.icon} ${p.title}</a></li>
                `).join('');
            } else {
                pageHtml += `
                    <div class="${sectionClass}">
                        <span class="md-drawer__section-title">${catInfo.icon} ${catInfo.label}</span>
                        <ul class="md-nav-list">
                            ${catPages.map(p => `
                                <li><a href="#/${p.path}">${p.title}</a></li>
                            `).join('')}
                        </ul>
                    </div>`;
            }
        }

        navList.innerHTML = navHtml;
        pageList.innerHTML = pageHtml || '<div class="md-drawer__section"><span class="md-drawer__section-title">页面</span></div>';

        // 更新底部计数
        const pageCount = document.getElementById('page-count');
        if (pageCount) {
            pageCount.textContent = `共 ${this.pages.length} 个页面`;
        }
    }

    /**
     * 初始化搜索
     */
    initSearch() {
        const input = document.getElementById('search-input');
        const clearBtn = document.getElementById('search-clear');
        if (!input) return;

        // 构建搜索索引 (延迟加载)
        this.buildSearchIndex();

        // 搜索防抖
        let debounceTimer;
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const query = input.value.trim();
            if (query.length > 0) {
                clearBtn.classList.add('visible');
                debounceTimer = setTimeout(() => this.search(query), 200);
            } else {
                clearBtn.classList.remove('visible');
                this.closeSearchResults();
            }
        });

        // 清除搜索
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.classList.remove('visible');
            this.closeSearchResults();
            input.focus();
        });

        // Escape 关闭
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                input.blur();
                this.closeSearchResults();
            }
        });

        // 点击外部关闭搜索结果
        document.addEventListener('click', (e) => {
            const results = document.getElementById('search-results');
            const container = document.getElementById('search-container');
            if (results && container && !container.contains(e.target) && !results.contains(e.target)) {
                this.closeSearchResults();
            }
        });
    }

    /**
     * 构建搜索索引
     * 索引结构: { path, title, content (纯文本) }
     */
    async buildSearchIndex() {
        // 清除旧索引
        this.searchIndex = [];

        // 为每个页面构建索引
        for (const page of this.pages) {
            try {
                const response = await fetch(`content/${page.path}.md`);
                if (response.ok) {
                    const text = await response.text();
                    // 提取纯文本 (去掉 Markdown 语法)
                    const plainText = text
                        .replace(/^---[\s\S]*?---/m, '') // 移除 Front Matter
                        .replace(/#{1,6}\s+/g, '')
                        .replace(/```[\s\S]*?```/g, '')
                        .replace(/`[^`]+`/g, '')
                        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                        .replace(/[*_~]{1,2}/g, '')
                        .replace(/[>\|]/gm, '')
                        .replace(/\n{3,}/g, '\n')
                        .trim();

                    // 提取标题
                    const titleMatch = text.match(/^#\s+(.+)/m);
                    const title = titleMatch ? titleMatch[1].trim() : page.title;

                    this.searchIndex.push({
                        path: page.path,
                        title: title,
                        content: plainText
                    });
                }
            } catch (e) {
                // 跳过无法加载的页面
            }
        }

        console.log(`[WikiApp] 搜索索引构建完成: ${this.searchIndex.length} 条目`);
    }

    /**
     * 执行搜索
     */
    search(query) {
        if (!query || !this.searchIndex.length) {
            this.closeSearchResults();
            return;
        }

        const q = query.toLowerCase();
        const results = [];

        for (const page of this.searchIndex) {
            const titleLower = page.title.toLowerCase();
            const contentLower = page.content.toLowerCase();

            // 标题匹配 (权重高)
            const titleScore = titleLower.includes(q) ? 100 : 0;
            // 内容匹配
            const contentScore = contentLower.includes(q) ? 10 : 0;

            // 精确词匹配
            let wordScore = 0;
            const words = q.split(/\s+/).filter(w => w.length > 0);
            words.forEach(word => {
                if (titleLower.includes(word)) wordScore += 50;
                if (contentLower.includes(word)) wordScore += 5;
            });

            const totalScore = titleScore + contentScore + wordScore;
            if (totalScore > 0) {
                // 生成摘要
                const snippet = this.generateSnippet(page.content, q);
                results.push({
                    path: page.path,
                    title: page.title,
                    snippet,
                    score: totalScore
                });
            }
        }

        // 按相关度排序
        results.sort((a, b) => b.score - a.score);
        // 最多显示 20 条
        const topResults = results.slice(0, 20);

        this.renderSearchResults(topResults, query);
    }

    /**
     * 生成搜索摘要
     */
    generateSnippet(content, query) {
        const maxLength = 150;
        const q = query.toLowerCase();
        const idx = content.toLowerCase().indexOf(q);

        if (idx === -1) {
            return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
        }

        const start = Math.max(0, idx - 50);
        const end = Math.min(content.length, idx + query.length + 80);
        let snippet = content.slice(start, end).trim();

        if (start > 0) snippet = '...' + snippet;
        if (end < content.length) snippet += '...';

        // 高亮匹配词
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        snippet = snippet.replace(
            new RegExp(`(${escapedQuery})`, 'gi'),
            '<span class="search-highlight">$1</span>'
        );

        return snippet;
    }

    /**
     * 渲染搜索结果
     */
    renderSearchResults(results, query) {
        let container = document.getElementById('search-results');
        if (!container) {
            container = document.createElement('div');
            container.id = 'search-results';
            document.body.appendChild(container);
        }

        if (results.length === 0) {
            container.innerHTML = `<div class="search-empty">没有找到 "<strong>${this.escapeHtml(query)}</strong>" 的相关结果</div>`;
        } else {
            container.innerHTML = results.map(r => `
                <a href="#/${r.path}" class="search-result-item" data-search-close>
                    <div class="search-result-item__title">${this.escapeHtml(r.title)}</div>
                    <div class="search-result-item__snippet">${r.snippet}</div>
                    <div class="search-result-item__path">${r.path}.md</div>
                </a>
            `).join('');
        }

        container.classList.add('open');

        // 点击搜索结果导航
        container.querySelectorAll('[data-search-close]').forEach(link => {
            link.addEventListener('click', () => {
                this.closeSearchResults();
                document.getElementById('search-input').value = '';
                document.getElementById('search-clear').classList.remove('visible');
            });
        });
    }

    /**
     * 关闭搜索结果面板
     */
    closeSearchResults() {
        const container = document.getElementById('search-results');
        if (container) {
            container.classList.remove('open');
        }
    }

    /**
     * 初始化侧边栏抽屉
     */
    initDrawer() {
        const menuBtn = document.getElementById('menu-toggle');
        const drawer = document.getElementById('sidebar');
        const overlay = document.getElementById('drawer-overlay');

        if (!menuBtn || !drawer) return;

        const toggleDrawer = () => {
            const isOpen = drawer.classList.toggle('open');
            overlay.classList.toggle('open', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
            menuBtn.setAttribute('aria-label', isOpen ? '关闭导航菜单' : '打开导航菜单');
        };

        const closeDrawer = () => {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
            document.body.style.overflow = '';
            menuBtn.setAttribute('aria-label', '打开导航菜单');
        };

        menuBtn.addEventListener('click', toggleDrawer);
        if (overlay) overlay.addEventListener('click', closeDrawer);

        // 点击导航链接后自动关闭抽屉 (移动端)
        drawer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeDrawer);
        });

        // 窗口大小变化时自动关闭移动端抽屉
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768) {
                    closeDrawer();
                }
            }, 200);
        });
    }

    /**
     * 初始化主题切换按钮
     */
    initThemeToggle() {
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.addEventListener('click', () => {
                wikiTheme.toggle();
                // 显示切换提示
                this.showSnackbar(`主题已切换至: ${
                    wikiTheme.mode === 'auto' ? '自动' :
                    wikiTheme.mode === 'dark' ? '深色' : '浅色'
                }`);
            });
        }
    }

    /**
     * 初始化键盘快捷键
     */
    initKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: 聚焦搜索
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const input = document.getElementById('search-input');
                if (input) input.focus();
            }
            // / : 聚焦搜索 (除输入框外)
            if (e.key === '/' && !e.ctrlKey && !e.metaKey &&
                !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                e.preventDefault();
                const input = document.getElementById('search-input');
                if (input) input.focus();
            }
            // Escape: 关闭搜索结果
            if (e.key === 'Escape') {
                this.closeSearchResults();
            }
        });
    }

    /**
     * 显示 Snackbar 消息
     */
    showSnackbar(message) {
        let snackbar = document.getElementById('md-snackbar');
        if (!snackbar) {
            snackbar = document.createElement('div');
            snackbar.id = 'md-snackbar';
            snackbar.style.cssText = `
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: var(--md-text-primary);
                color: var(--md-surface);
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 0.875rem;
                font-weight: 500;
                box-shadow: var(--md-elevation-8);
                z-index: 1000;
                opacity: 0;
                transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
                white-space: nowrap;
                font-family: var(--md-font-family);
            `;
            document.body.appendChild(snackbar);
        }

        snackbar.textContent = message;
        requestAnimationFrame(() => {
            snackbar.style.opacity = '1';
            snackbar.style.transform = 'translateX(-50%) translateY(0)';
        });

        clearTimeout(snackbar._hideTimer);
        snackbar._hideTimer = setTimeout(() => {
            snackbar.style.opacity = '0';
            snackbar.style.transform = 'translateX(-50%) translateY(100px)';
        }, 2500);
    }

    /**
     * HTML 转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// =========================================
// 启动应用
// =========================================
let wikiApp;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        wikiApp = new WikiApp();
        wikiApp.init();
    });
} else {
    wikiApp = new WikiApp();
    wikiApp.init();
}
