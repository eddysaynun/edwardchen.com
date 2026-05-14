#!/bin/bash

# Obsidian Blog Sync Script
# 同步 Obsidian 博客目录到项目

OBSIDIAN_BLOG="/Users/edward/Library/Mobile Documents/iCloud~md~obsidian/Documents/05-Blog"
PROJECT_BLOG="/Users/edward/workspace/edward/edwardchen.com/src/content/blog"

echo "📝 同步 Obsidian 博客文章..."

# 确保目录存在
mkdir -p "$PROJECT_BLOG"

# 同步文件（复制而不是链接），排除 README.md
rsync -av --delete --exclude="README.md" "$OBSIDIAN_BLOG/" "$PROJECT_BLOG/"

# 显示同步结果
echo "✅ 同步完成！"
echo "📂 源目录：$OBSIDIAN_BLOG"
echo "📂 目标目录：$PROJECT_BLOG"
echo ""
echo "📊 文件统计:"
ls -1 "$PROJECT_BLOG"/*.md 2>/dev/null | wc -l | xargs -I {} echo "   - {} 篇文章"
echo ""
echo "📄 最新文章:"
ls -1t "$PROJECT_BLOG"/*.md 2>/dev/null | head -3 | while read file; do
    echo "   - $(basename "$file")"
done
