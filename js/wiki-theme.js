/**
 * Wiki 主题管理器
 * =========================================
 * 核心功能: 用 JavaScript 显式读取系统 AccentColor 的
 * 真实 RGB 色值，写入 CSS 自定义属性，保证所有元素
 * (图标、按钮、边框等) 都能正确继承用户 Windows 主题色。
 *
 * 原理:
 *   CSS system color "AccentColor" 在某些浏览器中通过
 *   var() 传递时不会解析为具体色值。因此我们在 JS 中
 *   创建一个隐藏元素, 读取其实际 computed 颜色, 再写入
 *   :root 的 CSS 变量中, 确保所有子元素都能继承。
 */
class WikiTheme {
    constructor() {
        this.mode = 'auto';     // 'light' | 'dark' | 'auto'
        this.systemDark = false;
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.resolvedAccent = null; // 缓存解析后的主题色
        this.init();
    }

    init() {
        // 1. 读取已保存的主题偏好
        const saved = localStorage.getItem('wiki-theme');
        if (saved && ['light', 'dark', 'auto'].includes(saved)) {
            this.mode = saved;
        }

        // 2. 检测系统深色模式
        this.systemDark = this.mediaQuery.matches;

        // 3. 立即解析系统 AccentColor 并写入 CSS 变量 (关键!)
        this.resolveAndApplyAccent();

        // 4. 应用主题 data-theme
        this.applyThemeMode();

        // 5. 监听系统深色/浅色切换
        this.mediaQuery.addEventListener('change', (e) => {
            this.systemDark = e.matches;
            if (this.mode === 'auto') {
                this.applyThemeMode();
                this.resolveAndApplyAccent();
            }
        });

        // 6. 周期性检测系统主题色变化 (Windows 用户更改主题色时)
        this.watchAccentChange();

        console.log(`[WikiTheme] 初始化完成 | 模式: ${this.mode} | 深色模式: ${this.systemDark}`);
    }

    /**
     * 关键方法: 从系统读取 AccentColor 的真实色值, 写入 CSS 变量
     *
     * 用隐藏元素 + getComputedStyle 获取具体 RGB 值,
     * 然后设置到 :root 的 --md-accent-rgb 和 --md-primary 上。
     */
    resolveAndApplyAccent() {
        // 创建临时元素读取系统 AccentColor
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;color:AccentColor;background:AccentColor;';
        document.body.appendChild(el);

        const computed = getComputedStyle(el);
        const accentColor = computed.color;   // 例如 "rgb(0, 120, 212)"
        const accentBg = computed.backgroundColor;

        document.body.removeChild(el);

        // 从 "rgb(r, g, b)" 中提取数字
        const rgbMatch = accentColor.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        let rgb = null;
        if (rgbMatch) {
            rgb = `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`;
        }

        // 缓存
        this.resolvedAccent = accentColor;

        // --- 写入 CSS 变量到 :root ---
        const root = document.documentElement;

        if (rgb) {
            // 设置 RGB 分量 (供 color-mix 使用)
            root.style.setProperty('--md-accent-rgb', rgb);
            // 主色: 具体 rgb() 值, 不再是关键字, 保证继承
            root.style.setProperty('--md-primary', accentColor);
            // 浅色变体
            root.style.setProperty('--md-primary-light', `rgba(${rgb}, 0.7)`);
            // 深色变体
            root.style.setProperty('--md-primary-dark', `rgba(${rgb}, 0.7)`);
            // 12% 透明背景
            root.style.setProperty('--md-primary-bg', `rgba(${rgb}, 0.12)`);
            // 30% 透明边框
            root.style.setProperty('--md-primary-border', `rgba(${rgb}, 0.30)`);
        } else {
            // fallback
            root.style.setProperty('--md-primary', accentColor || '#1976D2');
        }

        // 更新 meta theme-color
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.content = this.getEffective() === 'dark'
                ? this.darkenColor(accentColor, 0.15)
                : accentColor;
        }

        console.log(`[WikiTheme] 系统主题色已解析: ${accentColor} (rgb: ${rgb})`);

        // 触发全局事件
        document.dispatchEvent(new CustomEvent('accentchange', {
            detail: { color: accentColor, rgb }
        }));
    }

    /**
     * 应用主题模式 (data-theme / color-scheme)
     */
    applyThemeMode() {
        const effective = this.getEffective();
        const root = document.documentElement;
        root.setAttribute('data-theme', this.mode);
        root.style.setProperty('color-scheme', effective);

        // 更新按钮 aria-label
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            const label = this.mode === 'auto' ? '自动主题' :
                          this.mode === 'dark' ? '深色主题' : '浅色主题';
            btn.setAttribute('aria-label', `当前: ${label}。点击切换`);
        }

        document.dispatchEvent(new CustomEvent('themechange', {
            detail: { mode: this.mode, effective }
        }));
    }

    getEffective() {
        return this.mode === 'auto'
            ? (this.systemDark ? 'dark' : 'light')
            : this.mode;
    }

    toggle() {
        const order = ['auto', 'light', 'dark'];
        const idx = order.indexOf(this.mode);
        this.mode = order[(idx + 1) % order.length];
        localStorage.setItem('wiki-theme', this.mode);
        this.applyThemeMode();
        this.resolveAndApplyAccent();
    }

    setMode(mode) {
        if (['light', 'dark', 'auto'].includes(mode)) {
            this.mode = mode;
            localStorage.setItem('wiki-theme', this.mode);
            this.applyThemeMode();
            this.resolveAndApplyAccent();
        }
    }

    /**
     * 监视系统主题色变化 (Windows 用户修改主题色时自动更新)
     */
    watchAccentChange() {
        const check = () => {
            const el = document.createElement('div');
            el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;color:AccentColor;';
            document.body.appendChild(el);
            const current = getComputedStyle(el).color;
            document.body.removeChild(el);

            if (current !== this.resolvedAccent) {
                console.log('[WikiTheme] 检测到系统主题色变化:', current);
                this.resolveAndApplyAccent();
                // 强制重绘
                document.body.style.transform = 'translateZ(0)';
                requestAnimationFrame(() => { document.body.style.transform = ''; });
            }
            setTimeout(check, 2000);
        };
        setTimeout(check, 3000);
    }

    /**
     * 获取当前系统主题色 (已解析的具体色值)
     */
    getAccentColor() {
        return this.resolvedAccent ||
            getComputedStyle(document.documentElement)
                .getPropertyValue('--md-primary').trim() || '#1976D2';
    }

    darkenColor(color, amount) {
        try {
            const ctx = document.createElement('canvas').getContext('2d');
            ctx.fillStyle = color;
            const hex = ctx.fillStyle;
            const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
            if (m) {
                const r = Math.round(parseInt(m[1],16)*(1-amount));
                const g = Math.round(parseInt(m[2],16)*(1-amount));
                const b = Math.round(parseInt(m[3],16)*(1-amount));
                return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
            }
        } catch(e) {}
        return color;
    }
}

// 全局单例
const wikiTheme = new WikiTheme();
