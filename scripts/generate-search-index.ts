import { readdir, readFile } from 'node:fs/promises';
import { join, parse } from 'node:path';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function getBlogPosts() {
  const blogDir = join(process.cwd(), 'src', 'content', 'blog');
  const files = await readdir(blogDir, { recursive: false });
  const posts = [];

  for (const file of files) {
    if (file.endsWith('.md') || file.endsWith('.mdx')) {
      const filePath = join(blogDir, file);
      const content = await readFile(filePath, 'utf-8');
      
      // 解析 frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) continue;
      
      const frontmatter = frontmatterMatch[1];
      const titleMatch = frontmatter.match(/title:\s*(.+)/);
      const descMatch = frontmatter.match(/description:\s*(.+)/);
      const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]*)\]/);
      const dateMatch = frontmatter.match(/pubDate:\s*(\d{4}-\d{2}-\d{2})/);
      const pinnedMatch = frontmatter.match(/pinned:\s*(true|false)/);
      
      if (!titleMatch) continue;
      
      const slug = parse(file).name;
      const title = titleMatch[1].replace(/['"]/g, '');
      const description = descMatch ? descMatch[1].replace(/['"]/g, '') : '';
      const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')) : [];
      const published = dateMatch ? new Date(dateMatch[1]) : new Date();
      const pinned = pinnedMatch ? pinnedMatch[1] === 'true' : false;
      
      // 提取正文内容（用于搜索）
      const body = content.replace(/^---\n[\s\S]*?\n---\n/, '').substring(0, 2000);
      
      posts.push({
        title,
        description,
        slug: `/blog/${slug}/`,
        published: published.toISOString(),
        tags,
        content: body,
        pinned,
      });
    }
  }

  // 排序：置顶优先，然后按日期倒序
  return posts.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.published).getTime() - new Date(a.published).getTime();
  });
}

async function main() {
  const posts = await getBlogPosts();
  
  const indexData = posts.map((post, index) => ({
    id: index,
    title: post.title,
    description: post.description,
    slug: post.slug,
    published: post.published,
    tags: post.tags,
    content: post.content,
  })).filter(item => item.published && !isNaN(new Date(item.published).getTime()));

  const outputPath = resolve(process.cwd(), 'public', 'search-index.json');
  writeFileSync(outputPath, JSON.stringify(indexData, null, 2));

  console.log(`✅ 搜索索引已生成：${indexData.length} 篇文章`);
}

main();
