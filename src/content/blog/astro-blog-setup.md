---
title: "从零搭建 Astro 个人博客"
description: "使用 Astro + TailwindCSS 构建一个现代化的静态博客，支持 Markdown 写作和自动部署。"
pubDate: 2025-05-10
updatedDate: 2025-05-14
tags: ["Astro", "博客", "静态站点", "TailwindCSS"]
pinned: true
---

# 从零搭建 Astro 个人博客

本文将介绍如何使用 Astro 和 TailwindCSS 从零搭建一个现代化的个人博客，并记录实际开发中遇到的问题和解决方案。

## 为什么选择 Astro？

Astro 是一个现代的 Web 框架，专为内容驱动的网站设计。它的主要优势包括：

- **极致的性能** — 默认零 JavaScript 输出
- **优秀的 SEO** — 静态生成支持
- **灵活的框架支持** — 可以使用 React、Vue、Svelte 组件
- **Markdown 原生支持** — 内容写作体验极佳

## 项目初始化

首先，我们需要创建一个新的 Astro 项目：

```bash
npm create astro@latest
# 或者
npx create-astro@latest
```

## 安装 TailwindCSS

使用 Astro 的官方 Tailwind 集成：

```bash
npm install -D @astrojs/tailwind tailwindcss
```

然后在 `astro.config.mjs` 中配置：

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
});
```

## 创建内容集合

Astro 的内容集合功能让我们可以类型安全地管理博客文章。

### 1. 创建配置文件

在 `src/content/config.ts` 中定义：

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

### 2. 创建文章

在 `src/content/blog/` 目录下创建 Markdown 或 MDX 文件：

```md
---
title: "我的第一篇博客"
description: "这是博客的简介"
pubDate: 2025-05-13
tags: ["技术", "笔记"]
---

# 正文内容

这里是博客的正文...
```

---

## 实战优化：Tag 展示与筛选功能

在实际开发中，我遇到了 tag 展示的问题，并进行了完整的优化。以下是详细的实现过程和踩坑记录。

### 问题描述

初始实现中，tag 标签挤在一起显示，例如 "AI 自动化生产力" 没有间距，用户体验不佳。

**目标：**
1. 添加 tag 之间的适当间距
2. 使用 Stone 色系保持极简设计
3. 添加悬停微交互
4. 实现 tag 点击筛选功能
5. 支持 URL 参数同步

### 解决方案

#### 第一步：视觉优化

**文件：** `src/pages/blog/[slug].astro`

**优化前：**
```astro
<div class="row">
  {post.data.tags.map((tag) => (
    <span class="pill">{tag}</span>
  ))}
</div>
```

**优化后：**
```astro
<div class="row gap-2 flex-wrap">
  {post.data.tags.map((tag) => (
    <a href={`/blog?tag=${encodeURIComponent(tag)}`} 
       class="pill text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 transition-colors px-3 py-1"
       aria-label={`查看 ${tag} 标签的文章`}>
      #{tag}
    </a>
  ))}
</div>
```

**关键改进：**
- `gap-2 flex-wrap`：添加间距并支持换行
- Stone 色系：`text-stone-600 bg-stone-100`
- 微交互：`hover:bg-stone-200 hover:text-stone-900 transition-colors`
- 标签前缀：添加 `#` 符号
- 可点击：改为 `<a>` 标签
- 无障碍：添加 `aria-label`

#### 第二步：客户端筛选功能

**问题：** 博客列表页的 tag 按钮点击没有反应

**解决方案：** 使用 `<script is:inline>` 添加客户端交互

**文件：** `src/pages/blog.astro`

```astro
---
import Layout from '../layouts/Layout.astro';
import { getCollection } from 'astro:content';

// ... 获取文章数据 ...
---

<Layout title="文章 - Edward Chen">
  <!-- Tags Filter -->
  <section class="sec rise d1">
    <div class="tags">
      <button class="tag" data-tag="all">
        全部
        <span class="ct">({posts.length})</span>
      </button>
      {allTags.map((tag) => (
        <button class="tag" data-tag={tag}>
          {tag}
          <span class="ct">({tagCounts[tag]})</span>
        </button>
      ))}
    </div>
  </section>

  <!-- Posts List -->
  <section class="sec rise d2">
    <ol class="posts" id="posts-list">
      {posts.map((post) => (
        <li class={`post ${post.data.pinned ? 'pinned' : ''}`} 
            data-tags={post.data.tags.join(',')}>
          <!-- 文章内容 -->
        </li>
      ))}
    </ol>
  </section>

  <script is:inline>
    (function() {
      const tagButtons = document.querySelectorAll('.tag');
      const posts = document.querySelectorAll('#posts-list .post');
      const urlParams = new URLSearchParams(window.location.search);
      const selectedTag = urlParams.get('tag');

      // 初始化：高亮选中的 tag
      if (selectedTag) {
        tagButtons.forEach(btn => {
          btn.classList.toggle('on', btn.dataset.tag === selectedTag);
        });
        filterPosts(selectedTag);
      } else {
        tagButtons[0]?.classList.add('on');
      }

      // 点击 tag 按钮
      tagButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const tag = btn.dataset.tag;
          
          // 更新按钮状态
          tagButtons.forEach(b => b.classList.remove('on'));
          btn.classList.add('on');

          // 更新 URL（不刷新页面）
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
          if (tag === 'all' || postTags.includes(tag)) {
            post.style.display = '';
          } else {
            post.style.display = 'none';
          }
        });
      }

      // 支持浏览器前进后退
      window.addEventListener('popstate', function(e) {
        var tag = (e.state && e.state.tag) || 'all';
        tagButtons.forEach(function(btn) {
          btn.classList.toggle('on', btn.dataset.tag === tag);
        });
        filterPosts(tag);
      });
    })();
  </script>
</Layout>
```

### 踩坑记录

#### 问题 1：Astro Script 组件报错

**错误信息：**
```
Unexpected "const"
pages/blog.astro:61:14
```

**原因：** `<Script>` 组件会压缩代码，导致语法错误

**错误写法：**
```astro
import Script from 'astro:script';
<Script>
  const x = 1;
</Script>
```

**正确写法：**
```astro
<script is:inline>
  const x = 1;
</script>
```

#### 问题 2：模板字符串被压缩

**错误：** 模板字符串在压缩后出错

**错误写法：**
```javascript
const url = `/blog?tag=${encodeURIComponent(tag)}`;
```

**正确写法：**
```javascript
const url = '/blog?tag=' + encodeURIComponent(tag);
```

#### 问题 3：现代 JavaScript 语法兼容

**错误：** 可选链和箭头函数在某些环境下不兼容

**错误写法：**
```javascript
const tag = e.state?.tag || 'all';
tagButtons.forEach(btn => { ... });
```

**正确写法：**
```javascript
var tag = (e.state && e.state.tag) || 'all';
tagButtons.forEach(function(btn) { ... });
```

### 设计细节

#### 颜色系统（Stone 主题）

```css
text-stone-600    /* 默认文字颜色 */
bg-stone-100      /* 默认背景色 */
hover:bg-stone-200 /* 悬停背景色 */
hover:text-stone-900 /* 悬停文字颜色 */
```

#### 间距规范

- **Tag 间距：** `gap-2` (0.5rem)
- **文字大小：** `text-xs` (0.75rem)
- **详情页 padding：** `px-3 py-1` (12px 水平，4px 垂直)
- **列表页 padding：** `px-2.5 py-0.5` (10px 水平，2px 垂直)

#### 微交互

- **过渡动画：** `transition-colors` (150ms 默认)
- **悬停状态：** 背景变深，文字变深
- **激活状态：** 添加 `class="on"` 到选中的 tag 按钮

### 数据属性模式

**Tag 按钮：**
```astro
<button class="tag" data-tag="all">全部</button>
<button class="tag" data-tag="AI">AI</button>
```

**文章列表项：**
```astro
<li class="post" data-tags="AI,自动化，生产力">
```

**JavaScript 访问：**
```javascript
const tag = btn.dataset.tag;  // "AI"
const postTags = post.dataset.tags.split(',');  // ["AI", "自动化", "生产力"]
```

### URL 同步

**Push State（不刷新页面）：**
```javascript
const newUrl = tag === 'all' 
  ? '/blog' 
  : '/blog?tag=' + encodeURIComponent(tag);
history.pushState({ tag: tag }, '', newUrl);
```

**从 URL 读取：**
```javascript
const urlParams = new URLSearchParams(window.location.search);
const selectedTag = urlParams.get('tag'); // "AI" 或 null
```

**浏览器导航支持：**
```javascript
window.addEventListener('popstate', function(e) {
  var tag = (e.state && e.state.tag) || 'all';
  // 更新 UI 和筛选
});
```

### 测试清单

- [x] Tag 显示有适当间距
- [x] 悬停效果流畅
- [x] 点击 tag 正确筛选文章
- [x] URL 更新不刷新页面
- [x] 选中的 tag 按钮显示 "on" 状态
- [x] "全部" 按钮显示所有文章
- [x] 浏览器前进/后退正常
- [x] 直接访问 `?tag=X` 加载筛选后的视图
- [x] 小屏幕下 tag 换行显示
- [x] 无障碍：aria-label 存在

---

## 部署到 Cloudflare Pages

### 1. 构建项目

```bash
npm run build
```

### 2. 部署到 Cloudflare

1. 在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 创建 Pages 项目
2. 连接 GitHub 仓库
3. 设置构建命令：`npm run build`
4. 设置输出目录：`dist`

### 3. 配置自定义域名（可选）

在 Cloudflare Pages 设置中添加自定义域名，自动配置 HTTPS。

## 总结

使用 Astro + TailwindCSS + Cloudflare Pages 是一个成本极低、性能优秀、易于维护的博客方案。适合个人开发者和技术写作者。

### 技术栈总结

| 模块 | 选择 | 说明 |
|------|------|------|
| 博客框架 | Astro | 静态生成，零 JS 输出 |
| 样式 | TailwindCSS | 原子化 CSS，快速开发 |
| 内容 | Markdown/MDX | 写作体验极佳 |
| 托管 | GitHub | 免费，版本控制 |
| 部署 | Cloudflare Pages | 全球 CDN，自动 HTTPS |

### 核心优化点

- **Tag 展示：** Stone 色系 + 微交互 + 间距优化
- **客户端筛选：** 无刷新筛选，URL 同步
- **无障碍设计：** aria-label，键盘导航
- **性能优化：** 零外部依赖，直接 DOM 操作

## 下一步

- [ ] 添加评论系统（Giscus）
- [ ] 添加搜索功能（Pagefind）
- [ ] 添加网站统计（Umami）
- [ ] 配置 RSS 订阅
- [ ] 实现 tag 云图展示
- [ ] 添加文章推荐算法

---

**更新时间**: 2025-05-14  
**阅读时间**: 8 分钟  
**Git Commit**: `88c2ec3` - 优化 tag 展示和筛选功能
