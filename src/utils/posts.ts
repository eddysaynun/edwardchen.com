/**
 * 文章排序工具
 * 支持置顶文章优先，然后按日期倒序排列
 */

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
 * @param posts 文章数组
 * @returns 排序后的文章数组（置顶在前，各自按日期倒序）
 */
export function sortPostsByPinnedAndDate(posts: BlogPost[]): BlogPost[] {
  // 分离置顶和普通文章
  const pinnedPosts = posts.filter(post => post.data.pinned);
  const normalPosts = posts.filter(post => !post.data.pinned);

  // 分别按日期排序（最新的在前）
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

  // 合并：置顶在前，普通在后
  return [...sortedPinned, ...sortedNormal];
}

/**
 * 获取文章发布日期（格式化）
 * @param pubDate 发布日期
 * @param locale 语言区域，默认 zh-CN
 * @returns 格式化后的日期字符串
 */
export function formatDate(pubDate?: Date, locale: string = 'zh-CN'): string {
  if (!pubDate) return '未发布';
  return pubDate.toLocaleDateString(locale);
}

/**
 * 按年份和月份分组文章
 * @param posts 文章数组
 * @returns 按年月分组的文章对象
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
 * @param key 年月键（如 "2026-05"）
 * @returns 显示文本（如 "2026 年 5 月"）
 */
export function getYearMonthLabel(key: string): string {
  if (key === '未发布') return '未发布';
  const [year, month] = key.split('-');
  return `${year}年${parseInt(month)}月`;
}
