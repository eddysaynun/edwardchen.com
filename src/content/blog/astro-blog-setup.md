---
title: "从零搭建 Astro 个人博客"
description: "使用 Astro + TailwindCSS 构建现代化静态博客，实现内容集合、置顶排序、时间线导航等最佳实践。"
pubDate: 2025-05-10
updatedDate: 2026-05-14
tags: ["Astro", "博客", "静态站点", "TailwindCSS", "最佳实践"]
pinned: true
---

# 从零搭建 Astro 个人博客

本文记录使用 Astro 构建个人博客的完整流程，涵盖项目初始化、内容管理、交互优化、组件抽象等核心环节，并总结实际开发中的最佳实践。

---

## 一、技术选型

### 为什么选择 Astro？

Astro 是专为内容驱动型网站设计的现代 Web 框架，核心优势包括：

1. **零 JavaScript 输出** — 默认不发送 JS，按需 hydration，性能极致
2. **静态生成优先** — 预渲染 HTML，SEO 友好
3. **多框架兼容** — 可混用 React、Vue、Svelte 组件
4. **Markdown 原生支持** — Content Collections 提供类型安全的内容管理

### 技术栈

| 模块 | 技术选型 | 理由 |
|------|----------|------|
| 框架 | Astro 4.x | 静态生成，零 JS 输出 |
| 样式 | TailwindCSS | 原子化 CSS，开发效率高 |
| 内容 | Markdown + Content Collections | 类型安全，写作体验佳 |
| 部署 | Cloudflare Pages | 全球 CDN，自动 HTTPS，免费 |
| 版本控制 | GitHub | 免费托管，CI/CD 集成 |

---

## 二、项目初始化

### 创建项目

```bash
npm create astro@latest my-blog
# 或
npx create-astro@latest my-blog
```

推荐选项：
- 使用空模板（Empty）
- 启用 TypeScript
- 添加 TailwindCSS 集成

### 安装 TailwindCSS

```bash
npm install -D @astrojs/tailwind tailwindcss
```

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
});
```

---

## 三、内容集合（Content Collections）

### 1. 定义 Schema

`src/content/config.ts`:

```ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()).default([]),
    pinned: z.boolean().default(false),
  }),
});

export const collections = {
  'blog': blogCollection,
};
```

**Schema 设计要点：**
- `title` 和 `description` 为必填字段
- `pubDate` 使用 `z.date()` 自动解析 ISO 字符串
- `tags` 默认为空数组，避免未定义错误
- `pinned` 控制文章置顶，默认 `false`

### 2. 创建文章

`src/content/blog/your-post.md`:

```md
---
title: "文章标题"
description: "文章摘要，用于列表页展示"
pubDate: 2026-05-14
tags: ["技术", "笔记"]
pinned: true
---

# 正文

这里是文章内容...
```

**Frontmatter 规范：**
- 日期格式：`YYYY-MM-DD`（ISO 8601）
- 标签数组：使用双引号，避免解析错误
- 置顶标识：`pinned: true` 即可

---

## 四、核心功能实现

### 4.1 Tag 展示与筛选

#### 问题描述

初始实现中，tag 标签挤在一起显示（如 "AI 自动化生产力"），缺乏间距和交互反馈。

#### 设计目标

1. 视觉：Stone 色系，适当间距，悬停微交互
2. 交互：点击筛选，URL 同步，浏览器导航支持
3. 无障碍：`aria-label`，键盘可访问

#### 实现方案

**单篇文章页** (`src/pages/blog/[slug].astro`):

```astro
<div class="row gap-2 flex-wrap">
  {post.data.tags.map((tag) => (
    <a href={`/blog?tag=${encodeURIComponent(tag)}`} 
       class="pill text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 transition-colors px-2.5 py-0.5"
       aria-label={`查看 ${tag} 标签的文章`}>
      #{tag}
    </a>
  ))}
</div>
```

**关键设计：**
- `gap-2 flex-wrap`：间距 + 换行
- Stone 色系：`text-stone-600 bg-stone-100`
- 微交互：`hover:bg-stone-200 transition-colors`
- 标签前缀：`#` 符号
- 可点击：`<a>` 标签跳转列表页

**博客列表页** (`src/pages/blog.astro`):

```astro
<!-- Tag 筛选按钮 -->
<div class="tags">
  <button class="tag" data-tag="all">
    全部 <span class="ct">({posts.length})</span>
  </button>
  {allTags.map((tag) => (
    <button class="tag" data-tag={tag}>
      {tag} <span class="ct">({tagCounts[tag]})</span>
    </button>
  ))}
</div>

<!-- 文章列表 -->
<ol class="posts" id="posts-list">
  {posts.map((post) => (
    <li class="post" data-tags={post.data.tags.join(',')}>
      <!-- 文章内容 -->
    </li>
  ))}
</ol>
```

**客户端筛选逻辑** (`<script is:inline>`):

```javascript
(function() {
  const tagButtons = document.querySelectorAll('.tag');
  const posts = document.querySelectorAll('#posts-list .post');
  const urlParams = new URLSearchParams(window.location.search);
  const selectedTag = urlParams.get('tag');

  // 初始化状态
  if (selectedTag) {
    tagButtons.forEach(btn => {
      btn.classList.toggle('on', btn.dataset.tag === selectedTag);
    });
    filterPosts(selectedTag);
  } else {
    tagButtons[0]?.classList.add('on');
  }

  // 点击筛选
  tagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      
      // 更新按钮状态
      tagButtons.forEach(b => b.classList.remove('on'));
      btn.classList.add('on');

      // 更新 URL（不刷新）
      const newUrl = tag === 'all' 
        ? '/blog' 
        : '/blog?tag=' + encodeURIComponent(tag);
      history.pushState({ tag: tag }, '', newUrl);

      // 筛选文章
      filterPosts(tag);
    });
  });

  // 筛选函数
  function filterPosts(tag) {
    posts.forEach(post => {
      const postTags = post.dataset.tags.split(',');
      post.style.display = (tag === 'all' || postTags.includes(tag)) ? '' : 'none';
    });
  }

  // 浏览器前进后退
  window.addEventListener('popstate', function(e) {
    var tag = (e.state && e.state.tag) || 'all';
    tagButtons.forEach(function(btn) {
      btn.classList.toggle('on', btn.dataset.tag === tag);
    });
    filterPosts(tag);
  });
})();
```

#### 踩坑记录

**问题 1：Script 组件压缩错误**

错误写法：
```astro
import Script from 'astro:script';
<Script>
  const x = 1;
</Script>
```

正确写法：
```astro
<script is:inline>
  const x = 1;
</script>
```

**问题 2：模板字符串兼容**

错误写法（压缩后出错）：
```javascript
const url = `/blog?tag=${encodeURIComponent(tag)}`;
```

正确写法：
```javascript
const url = '/blog?tag=' + encodeURIComponent(tag);
```

**问题 3：现代语法兼容**

错误写法：
```javascript
const tag = e.state?.tag || 'all';
tagButtons.forEach(btn => { ... });
```

正确写法：
```javascript
var tag = (e.state && e.state.tag) || 'all';
tagButtons.forEach(function(btn) { ... });
```

**最佳实践：**
- 使用 `<script is:inline>` 而非 `<Script>` 组件
- 避免模板字符串，使用字符串拼接
- 避免可选链 `?.` 和箭头函数，使用传统语法
- 使用 `var` 而非 `const/let` 增强兼容性

---

### 4.2 置顶文章功能

#### 需求分析

支持文章置顶，置顶文章在列表和首页优先展示，并带有视觉标识。

#### 实现方案

**排序逻辑：**
1. 分离置顶和普通文章
2. 各自按日期倒序排序
3. 合并：置顶在前，普通在后

**代码实现：**

```javascript
const pinnedPosts = allPosts.filter(post => post.data.pinned);
const normalPosts = allPosts.filter(post => !post.data.pinned);

const sortedPinned = pinnedPosts.sort((a, b) => {
  const dateA = a.data.pubDate || new Date(0);
  const dateB = b.data.pubDate || new Date(0);
  return dateB.getTime() - dateA.getTime();
});

const sortedNormal = normalPosts.sort((a, b) => {
  const dateA = a.data.pubDate || new Date(0);
  const dateB = b.data.pubDate || new Date(0);
  return dateB.getTime() - dateA.getTime();
});

const posts = [...sortedPinned, ...sortedNormal];
```

**视觉标识：**

```astro
<time class="date">
  {post.data.pubDate?.toLocaleDateString('zh-CN')}
  {post.data.pinned && (
    <span class="pinned-badge" title="置顶">📌</span>
  )}
</time>
```

**CSS 样式：**

```css
.post.pinned .date {
  color: var(--accent);
  font-weight: 500;
}

.post.pinned .pinned-badge {
  display: inline-block;
  margin-left: 0.5rem;
  font-size: 14px;
}

.post.pinned .date::after {
  content: '• 置顶';
  display: block;
  color: var(--accent);
  font-size: 10px;
  margin-top: 2px;
}
```

**效果：**
- 日期高亮（主题色）
- 图钉图标 📌
- "• 置顶" 文字说明

---

### 4.3 排序逻辑抽象化

#### 问题

排序代码在首页、博客列表页重复，维护成本高。

#### 解决方案

创建工具函数库，统一排序逻辑。

`src/utils/posts.ts`:

```typescript
export interface BlogPost {
  data: {
    pubDate?: Date;
    pinned?: boolean;
    [key: string]: unknown;
  };
  slug: string;
  [key: string]: unknown;
}

/**
 * 按置顶和日期排序文章
 */
export function sortPostsByPinnedAndDate(posts: BlogPost[]): BlogPost[] {
  const pinnedPosts = posts.filter(post => post.data.pinned);
  const normalPosts = posts.filter(post => !post.data.pinned);

  const sortedPinned = pinnedPosts.sort((a, b) => {
    const dateA = a.data.pubDate || new Date(0);
    const dateB = b.data.pubDate || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const sortedNormal = normalPosts.sort((a, b) => {
    const dateA = a.data.pubDate || new Date(0);
    const dateB = b.data.pubDate || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return [...sortedPinned, ...sortedNormal];
}

/**
 * 按年月分组文章
 */
export function groupPostsByYearMonth(posts: BlogPost[]): Record<string, BlogPost[]> {
  const groups: Record<string, BlogPost[]> = {};

  posts.forEach(post => {
    if (!post.data.pubDate) {
      if (!groups['未发布']) groups['未发布'] = [];
      groups['未发布'].push(post);
      return;
    }

    const year = post.data.pubDate.getFullYear();
    const month = String(post.data.pubDate.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;

    if (!groups[key]) groups[key] = [];
    groups[key].push(post);
  });

  return groups;
}

/**
 * 获取年月显示文本
 */
export function getYearMonthLabel(key: string): string {
  if (key === '未发布') return '未发布';
  const [year, month] = key.split('-');
  return `${year}年${parseInt(month)}月`;
}
```

**复用示例：**

`src/pages/index.astro`:
```astro
import { sortPostsByPinnedAndDate } from '../utils/posts';

const allPostsRaw = await getCollection('blog');
const allPosts = sortPostsByPinnedAndDate(allPostsRaw);
const latestPosts = allPosts.slice(0, 3);
```

**优势：**
- 代码复用，减少重复
- 统一排序逻辑，避免不一致
- 类型安全（TypeScript）
- 易于测试和维护

---

### 4.4 时间线组件

#### 需求

在博客列表页右侧添加时间线，按年月分组展示文章，支持滚动跟随和折叠。

#### 设计要点

1. **布局**：右侧固定宽度（280px），不挤占列表空间
2. **定位**：`position: sticky`，滚动时跟随
3. **分组**：按 `2026 年 5 月` 格式分组，显示文章数量
4. **交互**：可折叠，悬停效果，置顶标识
5. **响应式**：移动端隐藏

#### 实现

`src/components/Timeline.astro`:

```astro
---
import { sortPostsByPinnedAndDate, groupPostsByYearMonth, getYearMonthLabel } from '../utils/posts';

interface Props {
  posts: {
    data: {
      pubDate?: Date;
      title: string;
      pinned?: boolean;
    };
    slug: string;
  }[];
}

const { posts } = Astro.props;
const sortedPosts = sortPostsByPinnedAndDate(posts);
const groupedPosts = groupPostsByYearMonth(sortedPosts);

const yearMonths = Object.keys(groupedPosts).sort((a, b) => {
  if (a === '未发布' || b === '未发布') return a === '未发布' ? 1 : -1;
  return b.localeCompare(a);
});
---

<aside class="timeline">
  <div class="timeline-header">
    <h3>时间线</h3>
    <div class="timeline-toggle" title="收起/展开">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
  </div>

  <div class="timeline-content">
    {yearMonths.map((yearMonth) => (
      <div class="timeline-group">
        <div class="timeline-year">
          <span class="year-label">{getYearMonthLabel(yearMonth)}</span>
          <span class="year-count">({groupedPosts[yearMonth].length})</span>
        </div>
        
        <ul class="timeline-list">
          {groupedPosts[yearMonth].map((post) => (
            <li class={`timeline-item ${post.data.pinned ? 'pinned' : ''}`}>
              <div class="timeline-dot"></div>
              <div class="timeline-content-item">
                <time class="timeline-date">
                  {post.data.pubDate?.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                </time>
                <a href={`/blog/${post.slug}`} class="timeline-title">
                  {post.data.title}
                  {post.data.pinned && <span class="pinned-icon">📌</span>}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
</aside>

<style>
  .timeline {
    position: sticky;
    top: 5rem;
    max-height: calc(100vh - 6rem);
    overflow-y: auto;
    border-left: 1px solid var(--border);
    padding-left: 1.5rem;
    margin-left: 2rem;
  }

  .timeline-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 0;
    border-bottom: 1px solid var(--border);
  }

  .timeline-content.collapsed {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
  }

  .timeline-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0;
    transition: transform 0.2s;
  }

  .timeline-item:hover {
    transform: translateX(4px);
  }

  .timeline-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-muted);
    margin-top: 0.5rem;
    transition: all 0.2s;
  }

  .timeline-item:hover .timeline-dot {
    background: var(--accent);
    transform: scale(1.3);
  }

  @media (max-width: 768px) {
    .timeline {
      display: none;
    }
  }
</style>

<script is:inline>
  (function() {
    const toggle = document.querySelector('.timeline-toggle');
    const content = document.querySelector('.timeline-content');
    
    if (toggle && content) {
      toggle.addEventListener('click', () => {
        content.classList.toggle('collapsed');
        const svg = toggle.querySelector('svg path');
        if (svg) {
          const isCollapsed = content.classList.contains('collapsed');
          svg.setAttribute('d', isCollapsed ? 'M4 10L8 6L12 10' : 'M4 6L8 10L12 6');
        }
      });
    }
  })();
</script>
```

**布局集成：**

`src/pages/blog.astro`:
```astro
<section class="sec">
  <div class="posts-container">
    <ol class="posts" id="posts-list">
      <!-- 文章列表 -->
    </ol>
    <Timeline posts={posts} />
  </div>
</section>
```

`src/styles/global.css`:
```css
.posts-container {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 2rem;
  align-items: start;
}
```

**交互效果：**
- 悬停时文章右移 4px
- 圆点放大并高亮
- 置顶文章圆点始终高亮
- 点击标题收起/展开

---

## 五、部署与优化

### 5.1 Cloudflare Pages 部署

1. **构建项目**
   ```bash
   npm run build
   ```

2. **配置 Cloudflare Pages**
   - 连接 GitHub 仓库
   - 构建命令：`npm run build`
   - 输出目录：`dist`
   - 框架预设：Astro

3. **自定义域名**
   - 在 Cloudflare Dashboard 添加自定义域名
   - 自动配置 HTTPS

### 5.2 性能优化

**构建优化：**
- 使用 SSG（静态生成），避免 SSR
- 图片懒加载
- 字体子集化

**运行时优化：**
- 零 JavaScript 输出（按需 hydration）
- 客户端筛选使用原生 DOM 操作，无框架依赖
- 避免重排重绘，使用 `transform` 动画

### 5.3 SEO 优化

- 语义化 HTML 标签（`<article>`, `<time>`, `<aside>`）
- Meta 标签完整（title, description, Open Graph）
- 结构化数据（JSON-LD）
- 站点地图（sitemap.xml）
- RSS 订阅

---

## 六、最佳实践总结

### 6.1 代码组织

- **工具函数抽象**：排序、分组、格式化等通用逻辑放入 `src/utils/`
- **组件复用**：时间线、Tag 等可复用 UI 放入 `src/components/`
- **类型安全**：使用 TypeScript，定义清晰的接口

### 6.2 内容管理

- **Frontmatter 规范**：统一字段命名和格式
- **标签命名**：使用有意义的关键词，避免过长
- **置顶策略**：仅对重要文章使用 `pinned: true`

### 6.3 交互设计

- **无刷新筛选**：使用 `history.pushState` 更新 URL
- **浏览器导航**：监听 `popstate` 事件支持前进后退
- **无障碍**：添加 `aria-label`，键盘可访问

### 6.4 性能优先

- **避免框架依赖**：客户端交互使用原生 JavaScript
- **减少重排**：使用 `transform` 而非 `top/left`
- **按需加载**：图片、字体懒加载

---

## 七、后续扩展

- [ ] 评论系统（Giscus）
- [ ] 全文搜索（Pagefind）
- [ ] 网站统计（Umami）
- [ ] RSS 订阅
- [ ] Tag 云图
- [ ] 相关文章推荐
- [ ] 多语言支持（i18n）

---

**更新时间**: 2026-05-14  
**阅读时间**: 12 分钟  
**Git Commit**: `a5702c5` - 添加时间线组件并抽象排序逻辑
