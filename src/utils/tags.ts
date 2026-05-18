import { getCollection } from 'astro:content';

export interface TagEntry {
  name: string;
  count: number;
}

export const TAGS_PER_PAGE = 12;

export async function getAllTagsWithCounts(): Promise<TagEntry[]> {
  const posts = await getCollection('blog');
  const counts: Record<string, number> = {};

  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function paginateTags(tags: TagEntry[], page: number) {
  const totalPages = Math.max(1, Math.ceil(tags.length / TAGS_PER_PAGE));
  const start = (page - 1) * TAGS_PER_PAGE;
  return {
    items: tags.slice(start, start + TAGS_PER_PAGE),
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}
