# Obsidian 博客工作流

本文档介绍如何在 Obsidian 中高效管理博客文章，包括自动创建模版和新文章的方法。

## 📁 目录结构

```
Documents/
├── .obsidian/
│   └── templates/
│       └── 博客文章模版.md          # 博客文章模版
├── 05-Blog/                        # 博客文章目录
│   ├── astro-blog-setup.md
│   ├── ai-agent-workflow.md
│   ├── k8s-cluster-setup-arm64.md
│   └── ...
└── create-blog-post.sh             # 自动创建脚本
```

## 🚀 快速开始

### 方法 1：使用脚本创建新文章

```bash
# 在终端中执行
cd "/Users/edward/Library/Mobile Documents/iCloud~md~obsidian/Documents"
./create-blog-post.sh "文章标题"
```

**示例：**

```bash
./create-blog-post.sh "从零搭建 Kubernetes 集群"
```

**输出：**

```
✅ 成功创建新博客文章！
📄 文件路径：/Users/edward/Library/Mobile Documents/iCloud~md~obsidian/Documents/05-Blog/从零搭建-Kubernetes-集群 -20260514221053.md
📝 文章标题：从零搭建 Kubernetes 集群
📅 创建日期：2026-05-14

💡 提示：在 Obsidian 中打开并编辑此文件
```

### 方法 2：在 Obsidian 中手动创建

1. 打开 Obsidian
2. 进入 `05-Blog` 文件夹
3. 右键 → "New note from template" → 选择 "博客文章模版"
4. 编辑文章标题和内容

## 📝 模版结构

博客文章模版包含以下字段：

```yaml
---
title: ""              # 文章标题
description: ""        # 文章简介
pubDate: YYYY-MM-DD    # 发布日期
updatedDate: YYYY-MM-DD # 更新日期
tags: []               # 标签数组
pinned: false          # 是否置顶
---
```

## 🎨 文章写作规范

### 标题层级

- `#` - 文章主标题（一级）
- `##` - 主要章节（二级）
- `###` - 子章节（三级）
- `####` - 细节说明（四级）

### 代码块

使用语言标识符：

````markdown
```bash
# 命令行示例
kubectl get pods
```

```yaml
# 配置文件
apiVersion: v1
kind: Pod
```
````

### 表格

| 组件 | 版本 | 说明 |
|------|------|------|
| K8s | v1.28 | 容器编排 |
| Helm | v3.12 | 包管理 |

### 待办清单

- [x] 已完成步骤
- [ ] 待完成步骤

### 内部链接

```markdown
[[相关文章标题]]
[[k8s-cluster-setup-arm64|Kubernetes 集群搭建]]
```

## 🔧 自定义模版

编辑模版文件：

```
/Users/edward/Library/Mobile Documents/iCloud~md~obsidian/Documents/.obsidian/templates/博客文章模版.md
```

**可自定义内容：**

- 默认标签
- 文章结构
- 元数据字段
- 样式和格式

## 📱 同步到博客

完成文章后，同步到 Astro 博客：

```bash
# 1. 复制文章到项目
cp "05-Blog/文章标题.md" "workspace/astro-blog/src/content/blog/"

# 2. 构建博客
cd workspace/astro-blog
npm run build

# 3. 部署
npm run deploy
```

## 🛠️ 脚本说明

### create-blog-post.sh

**功能：** 自动创建基于模版的新博客文章

**参数：**
- `$1` - 文章标题（必需）

**工作流程：**
1. 检查参数
2. 验证模版文件
3. 复制模版到新文件
4. 更新标题和日期
5. 输出文件路径

**错误处理：**
- 缺少参数：显示用法提示
- 模版不存在：显示错误信息
- 文件创建失败：退出并返回错误码

## 💡 最佳实践

1. **及时保存** - 使用 Git 版本控制
2. **标签管理** - 保持一致的标签命名
3. **内部链接** - 建立文章关联
4. **定期更新** - 维护 `updatedDate`
5. **测试部署** - 本地预览后再发布

## 🔗 相关链接

- [Obsidian 官方文档](https://help.obsidian.md/)
- [Astro 博客教程](./astro-blog-setup.md)
- [Markdown 语法指南](https://www.markdownguide.org/)

---

**创建日期**: 2026-05-14  
**更新日期**: 2026-05-14
