/**
 * Wiki SPA 路由器
 * =========================================
 * Hash-based 客户端路由
 * 支持:
 * - 页面加载与缓存
 * - 导航历史管理
 * - 加载状态指示
 * - 错误处理 (404, 加载失败)
 * - 页面过渡动画
 */
class WikiRouter {
    constructor() {
        this.routes = new Map();
        this.currentPath = '';
        this.contentCache = new Map(); // 内容缓存
        this.maxCacheSize = 20;         // 最大缓存页数
        this.isLoading = false;
        this.basePath = 'content';      // Markdown 文件目录
    }

    /**
     * 初始化路由
     */
    init() {
        // 监听 hash 变化
        window.addEventListener('hashchange', () => {
            this.navigate(this.getHash());
        });

        // 监听页面关闭时清理
        window.addEventListener('beforeunload', () => {
            this.contentCache.clear();
        });

        console.log('[WikiRouter] 初始化完成');
    }

    /**
     * 获取当前 hash 路径
     */
    getHash() {
        const hash = window.location.hash.replace(/^#\/?/, '') || 'index';
        return hash;
    }

    /**
     * 导航到指定路径
     */
    async navigate(path) {
        if (this.isLoading || path === this.currentPath) return;

        path = path || 'index';

        // 赞助页跳转到独立 HTML 页面
        if (path === 'sponsor') {
            window.location.href = 'sponsor.html';
            return;
        }

        this.isLoading = true;
        this.showLoader(true);

        try {
            const content = await this.loadPage(path);
            this.currentPath = path;
            this.renderPage(content, path);
            this.updateActiveNav(path);
            this.updateDocumentTitle(content);
            this.updateFooter(path);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('[WikiRouter] 导航失败:', error);
            this.renderError(path, error);
            this.updateFooter(path);
        } finally {
            this.isLoading = false;
            this.showLoader(false);
        }
    }

    /**
     * 加载页面内容
     */
    async loadPage(path) {
        // 检查缓存
        if (this.contentCache.has(path)) {
            console.log(`[WikiRouter] 缓存命中: ${path}`);
            return this.contentCache.get(path);
        }

        // 构造 Markdown 文件路径
        const filePath = `${this.basePath}/${path}.md`;
        const response = await fetch(filePath);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`页面未找到: ${path}`);
            }
            throw new Error(`加载失败 (${response.status}): ${response.statusText}`);
        }

        const text = await response.text();

        // 写入缓存
        this.cacheContent(path, text);

        return text;
    }

    /**
     * 缓存页面内容 (LRU 策略)
     */
    cacheContent(path, content) {
        if (this.contentCache.size >= this.maxCacheSize) {
            // 删除最早添加的条目
            const firstKey = this.contentCache.keys().next().value;
            this.contentCache.delete(firstKey);
        }
        this.contentCache.set(path, content);
    }

    /**
     * 渲染页面
     */
    async renderPage(markdownText, path) {
        const contentBody = document.getElementById('content-body');
        if (!contentBody) return;

        // 等待 Markdown 渲染器就绪
        const { html, toc } = await wikiMarkdown.render(markdownText);

        // 组合 HTML: 目录 + 内容
        const fullHtml = toc + html;

        // 使用 DOM 操作更新 (比 innerHTML 更高效)
        contentBody.innerHTML = fullHtml;
        contentBody.classList.add('active');

        // 扫描并处理页面上的锚点跳转
        this.setupAnchorScroll(contentBody);
    }

    /**
     * 渲染错误页面
     */
    renderError(path, error) {
        const contentBody = document.getElementById('content-body');
        if (!contentBody) return;

        const is404 = error.message.includes('未找到');
        contentBody.innerHTML = `
            <div class="md-error">
                <div class="md-error__code">${is404 ? '404' : '错误'}</div>
                <div class="md-error__message">
                    ${is404
                        ? `页面 "<strong>${this.escapeHtml(path)}</strong>" 不存在`
                        : this.escapeHtml(error.message)
                    }
                </div>
                <p style="color: var(--md-text-disabled); font-size: 0.875rem;">
                    ${is404 ? '请检查路径是否正确，或返回 <a href="#/">首页</a>。' : '请刷新后重试。'}
                </p>
            </div>
        `;
        contentBody.classList.add('active');
    }

    /**
     * 显示/隐藏加载指示器
     */
    showLoader(visible) {
        const loader = document.getElementById('content-loader');
        const body = document.getElementById('content-body');
        if (loader) loader.classList.toggle('active', visible);
        if (body) body.classList.toggle('active', !visible);
    }

    /**
     * 更新导航激活状态
     */
    updateActiveNav(path) {
        document.querySelectorAll('.md-nav-list a').forEach(link => {
            const href = link.getAttribute('href');
            const linkPath = href ? href.replace(/^#\//, '') : '';
            link.classList.toggle('active', linkPath === path || linkPath === path + '.md');
        });
    }

    /**
     * 更新文档标题
     */
    updateDocumentTitle(content) {
        // 从 Markdown 内容中提取第一个 h1 作为标题
        const titleMatch = content.match(/^#\s+(.+)/m);
        const pageTitle = titleMatch ? titleMatch[1].trim() : 'Wiki';
        document.title = `${pageTitle} - Wiki`;

        // 更新应用栏标题
        const titleEl = document.getElementById('app-title');
        if (titleEl) {
            titleEl.textContent = pageTitle;
        }
    }

    /**
     * 更新页脚上下页导航
     */
    updateFooter(path) {
        const prevLink = document.getElementById('footer-prev');
        const nextLink = document.getElementById('footer-next');
        const prevTitle = document.getElementById('footer-prev-title');
        const nextTitle = document.getElementById('footer-next-title');
        if (!prevLink || !nextLink) return;

        const pages = wikiApp.pages || [];
        const idx = pages.findIndex(p => p.path === path);

        if (idx > 0) {
            const prev = pages[idx - 1];
            prevLink.href = `#/${prev.path}`;
            prevTitle.textContent = prev.title;
            prevLink.style.display = '';
        } else {
            prevLink.style.display = 'none';
        }

        if (idx >= 0 && idx < pages.length - 1) {
            const next = pages[idx + 1];
            nextLink.href = `#/${next.path}`;
            nextTitle.textContent = next.title;
            nextLink.style.display = '';
        } else {
            nextLink.style.display = 'none';
        }
    }

    /**
     * 设置锚点平滑滚动
     */
    setupAnchorScroll(container) {
        container.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                const target = document.getElementById(href.slice(1));
                if (target) {
                    e.preventDefault();
                    const offset = parseInt(getComputedStyle(document.documentElement)
                        .getPropertyValue('--md-app-bar-height')) || 64;
                    const top = target.getBoundingClientRect().top + window.pageYOffset - offset - 16;
                    window.scrollTo({ top, behavior: 'smooth' });

                    // 更新 URL hash 但不触发导航
                    history.replaceState(null, '', `#/?${href.slice(1)}`);
                }
            });
        });
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.contentCache.clear();
        console.log('[WikiRouter] 缓存已清除');
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

// 全局单例
const wikiRouter = new WikiRouter();
