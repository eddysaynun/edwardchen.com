import { getCollection } from 'astro:content';

export interface PostData {
  id: string;
  title: string;
  description: string;
  tags: string[];
  published: Date;
  slug: string;
}

/**
 * 获取相关文章
 * @param currentPost 当前文章
 * @param allPosts 所有文章列表
 * @param limit 返回数量
 */
export function getRelatedPosts(
  currentPost: PostData,
  allPosts: PostData[],
  limit: number = 3
): PostData[] {
  // 过滤掉当前文章
  const otherPosts = allPosts.filter(post => post.id !== currentPost.id);
  
  // 计算相关度分数
  const scoredPosts = otherPosts.map(post => {
    let score = 0;
    
    // 标签匹配（权重最高）
    const commonTags = currentPost.tags.filter(tag => post.tags.includes(tag));
    score += commonTags.length * 10;
    
    // 时间相近（权重中等）
    const timeDiff = Math.abs(
      new Date(currentPost.published).getTime() - new Date(post.published).getTime()
    );
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    if (daysDiff < 30) score += 5;
    if (daysDiff < 7) score += 3;
    
    // 描述关键词匹配（权重较低）
    const currentWords = currentPost.description.toLowerCase().split(/\s+/);
    const postWords = post.description.toLowerCase().split(/\s+/);
    const commonWords = currentWords.filter(word => 
      word.length > 2 && postWords.includes(word)
    );
    score += commonWords.length * 0.5;
    
    return { post, score };
  });
  
  // 按分数排序，取前 N 篇
  scoredPosts.sort((a, b) => b.score - a.score);
  
  return scoredPosts.slice(0, limit).map(item => item.post);
}

/**
 * Astro 集成用的辅助函数
 */
export async function getRelatedPostsForCollection(
  currentSlug: string,
  limit: number = 3
) {
  const allPosts = await getCollection('blog');
  
  const currentPost = allPosts.find(post => post.slug === currentSlug);
  if (!currentPost) return [];
  
  const postData: PostData = {
    id: currentPost.id,
    title: currentPost.data.title,
    description: currentPost.data.description,
    tags: currentPost.data.tags,
    published: currentPost.data.pubDate ?? new Date(0),
    slug: currentPost.slug,
  };

  const allPostsData: PostData[] = allPosts.map(post => ({
    id: post.id,
    title: post.data.title,
    description: post.data.description,
    tags: post.data.tags,
    published: post.data.pubDate ?? new Date(0),
    slug: post.slug,
  }));
  
  return getRelatedPosts(postData, allPostsData, limit);
}
