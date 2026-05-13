---
title: "从零搭建 Astro 个人博客"
description: "使用 Astro + TailwindCSS 构建一个现代化的静态博客，支持 Markdown 写作和自动部署。"
pubDate: 2025-05-10
tags: ["Astro", "博客", "静态站点"]
pinned: true
---

# 从零搭建 Astro 个人博客

本文将介绍如何使用 Astro 和 TailwindCSS 从零搭建一个现代化的个人博客。

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

## 下一步

- [ ] 添加评论系统（Giscus）
- [ ] 添加搜索功能（Pagefind）
- [ ] 添加网站统计（Umami）
- [ ] 配置 RSS 订阅

---

**更新时间**: 2025-05-10  
**阅读时间**: 5 分钟
