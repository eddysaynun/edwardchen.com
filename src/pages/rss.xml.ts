import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { sortPostsByPinnedAndDate } from '../utils/posts';

export const prerender = true;

export async function GET(context) {
  const posts = await getCollection('blog');
  const sortedPosts = sortPostsByPinnedAndDate(posts);

  return rss({
    title: 'Edward Chen',
    description: '构建事物的笔记',
    site: context.site!,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
      content: post.body,
      categories: post.data.tags,
    })),
  });
}
