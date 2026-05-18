import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { sortPostsByPinnedAndDate } from '../utils/posts';

export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = sortPostsByPinnedAndDate(await getCollection('blog'));

  const data = posts.map((post, index) => ({
    id: index,
    title: post.data.title,
    description: post.data.description,
    slug: `/blog/${post.slug}/`,
    published: (post.data.pubDate ?? new Date()).toISOString(),
    tags: post.data.tags,
    content: post.body.slice(0, 2000),
  }));

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};
