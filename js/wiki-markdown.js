/**
 * Wiki Markdown 渲染引擎
 * =========================================
 * 基于 marked.js 构建, 扩展了:
 * - 自动生成目录 (TOC)
 * - 警告/提示框 (Alert) 扩展语法
 * - 代码高亮 (highlight.js)
 * - 标题锚点自动生成
 * - 任务列表
 * - 表格增强
 */

// 工具函数: HTML 转义 (独立函数, 避免 this 上下文问题)
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

class WikiMarkdown {
    constructor() {
        this.headings = [];
        this.initPromise = this.init();
    }

    async init() {
        // 等待 marked.js 加载
        if (typeof marked === 'undefined') {
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const check = () => {
                    if (typeof marked !== 'undefined') resolve();
                    else if (attempts++ > 200) {
                        console.error('[WikiMarkdown] marked.js 加载超时');
                        reject(new Error('marked.js 加载超时'));
                    }
                    else setTimeout(check, 50);
                };
                check();
            });
        }

        // 配置 marked
        marked.setOptions({
            breaks: true,
            gfm: true,
        });

        // 注册扩展
        this.registerAlertExtension();
        this.registerCustomRenderer();

        console.log('[WikiMarkdown] 初始化完成');
    }

    /**
     * 注册警告/提示框扩展
     * 语法: ::: type [title] \n content \n :::
     */
    registerAlertExtension() {
        const alertExt = {
            name: 'alert',
            level: 'block',
            start(src) { return src.indexOf(':::'); },
            tokenizer(src) {
                // 带标题: ::: type [title]
                const m1 = src.match(/^::: +(\w+) +\[([^\]]*)\]\n([\s\S]*?)\n:::/);
                if (m1 && ['info','warning','danger','success'].includes(m1[1].toLowerCase())) {
                    return {
                        type: 'alert',
                        raw: m1[0],
                        tokens: marked.Lexer.lexInline(m1[3].trim()),
                        alertType: m1[1].toLowerCase(),
                        alertTitle: m1[2] || undefined,
                        text: m1[3].trim()
                    };
                }
                // 不带标题: ::: type
                const m2 = src.match(/^::: +(\w+)\n([\s\S]*?)\n:::/);
                if (m2 && ['info','warning','danger','success'].includes(m2[1].toLowerCase())) {
                    return {
                        type: 'alert',
                        raw: m2[0],
                        tokens: marked.Lexer.lexInline(m2[2].trim()),
                        alertType: m2[1].toLowerCase(),
                        text: m2[2].trim()
                    };
                }
                return undefined;
            },
            renderer(token) {
                const titles = { info: '提示', warning: '警告', danger: '危险', success: '完成' };
                const title = token.alertTitle || titles[token.alertType];
                let body;
                try {
                    body = marked.parseInline(token.text, { async: false });
                } catch (e) {
                    body = escapeHtml(token.text);
                }
                return `<div class="md-alert md-alert--${token.alertType}">
                    <div class="md-alert__title">${escapeHtml(title)}</div>
                    ${body}
                </div>\n`;
            }
        };
        marked.use({ extensions: [alertExt] });
    }

    /**
     * 注册自定义渲染器
     */
    registerCustomRenderer() {
        const renderer = new marked.Renderer();
        const self = this;

        // 标题: 自动锚点 + 收集目录
        renderer.heading = function (text, level, raw) {
            const id = raw
                .toLowerCase()
                .replace(/<[^>]*>/g, '')
                .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '') || `h-${Math.random().toString(36).slice(2, 6)}`;
            if (self.headings) {
                self.headings.push({
                    id,
                    text: raw.replace(/<[^>]*>/g, ''),
                    level
                });
            }
            return `<h${level} id="${id}">${text}</h${level}>`;
        };

        // 链接: 外部链接新窗口
        renderer.link = function (href, title, text) {
            const ext = href && (href.startsWith('http://') || href.startsWith('https://'));
            const a = ext ? ' target="_blank" rel="noopener"' : '';
            const t = title ? ` title="${escapeHtml(title)}"` : '';
            return `<a href="${escapeHtml(href||'#')}"${t}${a}>${text}</a>`;
        };

        // 图片: 懒加载
        renderer.image = function (href, title, text) {
            const t = title ? ` title="${escapeHtml(title)}"` : '';
            return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text||'')}"${t} loading="lazy">`;
        };

        // 表格: 水平滚动容器
        renderer.table = function (header, body) {
            return `<div class="md-table-wrapper"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
        };

        // 代码块: highlight.js 高亮
        renderer.code = function (code, language) {
            if (typeof hljs !== 'undefined' && language && hljs.getLanguage(language)) {
                try {
                    const v = hljs.highlight(code, { language, ignoreIllegals: true }).value;
                    return `<pre><code class="hljs language-${language}">${v}</code></pre>`;
                } catch (e) { /* fallthrough */ }
            }
            const cls = language ? ` class="language-${language}"` : '';
            return `<pre><code${cls}>${escapeHtml(code)}</code></pre>`;
        };

        marked.use({ renderer });
    }

    /**
     * 渲染 Markdown 为 HTML
     * @returns {{ html: string, toc: string, headings: Array }}
     */
    async render(markdownText) {
        await this.initPromise;
        this.headings = [];

        let html;
        try {
            html = await marked.parse(markdownText);
        } catch (e) {
            console.error('[WikiMarkdown] 渲染失败:', e);
            html = `<div class="md-error">
                <div class="md-error__code">渲染错误</div>
                <div class="md-error__message">${escapeHtml(e.message)}</div>
            </div>`;
        }

        const toc = this.generateTOC();

        // 异步高亮代码
        if (typeof hljs !== 'undefined') {
            setTimeout(() => {
                document.querySelectorAll('.md-content__body pre code:not(.hljs)').forEach(block => {
                    try { hljs.highlightElement(block); } catch (e) {}
                });
            }, 50);
        }

        return { html, toc, headings: [...this.headings] };
    }

    /**
     * 生成 TOC 目录 HTML
     */
    generateTOC() {
        const items = (this.headings || []).filter(h => h.level <= 3);
        if (items.length < 2) return '';

        let html = '<details class="md-toc" open><summary>目录</summary><ul>';
        let stack = [1];
        items.forEach(h => {
            while (stack.length > 0 && stack[stack.length-1] < h.level) {
                html += '<ul>'; stack.push(h.level);
            }
            while (stack.length > 0 && stack[stack.length-1] > h.level) {
                html += '</ul>'; stack.pop();
            }
            html += `<li><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`;
        });
        while (stack.length > 0) { html += '</ul>'; stack.pop(); }
        html += '</details>';
        return html;
    }
}

// 全局单例
const wikiMarkdown = new WikiMarkdown();
