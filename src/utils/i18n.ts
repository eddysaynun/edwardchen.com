/**
 * 多语言配置
 */

export type Language = 'zh-CN' | 'en';

export interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

export const translations: Translations = {
  // 导航
  'nav.home': { 'zh-CN': '首页', en: 'Home' },
  'nav.blog': { 'zh-CN': '文章', en: 'Blog' },
  'nav.tags': { 'zh-CN': '标签', en: 'Tags' },
  'nav.projects': { 'zh-CN': '项目', en: 'Projects' },
  'nav.about': { 'zh-CN': '关于', en: 'About' },
  
  // 首页
  'home.meta': { 'zh-CN': '个人开发者 · AI 爱好者 · 技术写作者', en: 'Developer · AI Enthusiast · Technical Writer' },
  'home.greeting': { 'zh-CN': '你好，我是', en: 'Hi, I\'m' },
  'home.lede': { 'zh-CN': '我喜欢构建有趣的东西，探索 AI 的可能性，并分享我的学习旅程。这里是我的技术笔记、项目展示和思考记录。', en: 'I love building interesting things, exploring AI possibilities, and sharing my learning journey. This is my technical notes, project showcase, and thought records.' },
  'home.readPosts': { 'zh-CN': '阅读文章', en: 'Read Posts' },
  'home.viewProjects': { 'zh-CN': '查看项目', en: 'View Projects' },
  'home.latestPosts': { 'zh-CN': '最新文章', en: 'Latest Posts' },
  'home.viewAll': { 'zh-CN': '查看全部 →', en: 'View All →' },
  'home.projects': { 'zh-CN': '项目', en: 'Projects' },
  'home.now': { 'zh-CN': '正在进行', en: 'Now' },
  
  // 博客
  'blog.title': { 'zh-CN': '文章 - Edward Chen', en: 'Blog - Edward Chen' },
  'blog.meta': { 'zh-CN': '技术笔记 · 学习记录 · 项目经验', en: 'Technical Notes · Learning Records · Project Experience' },
  'blog.lede': { 'zh-CN': '记录技术探索、项目经验和学习心得。', en: 'Recording technical explorations, project experiences, and learning insights.' },
  'blog.viewAll': { 'zh-CN': '查看全部 →', en: 'View All →' },
  'blog.all': { 'zh-CN': '全部', en: 'All' },
  'blog.timeline': { 'zh-CN': '时间线', en: 'Timeline' },
  'blog.toc': { 'zh-CN': '目录', en: 'Table of Contents' },
  'blog.pinned': { 'zh-CN': '置顶', en: 'Pinned' },
  'blog.comments': { 'zh-CN': '💬 评论', en: '💬 Comments' },
  
  // 项目
  'projects.title': { 'zh-CN': '项目 - Edward Chen', en: 'Projects - Edward Chen' },
  'projects.meta': { 'zh-CN': '开源项目 · 工具 · 实验', en: 'Open Source · Tools · Experiments' },
  'projects.lede': { 'zh-CN': '我参与和创建的项目，包括开源工具、个人实验和技术演示。', en: 'Projects I\'ve worked on and created, including open source tools, personal experiments, and tech demos.' },
  'projects.status.active': { 'zh-CN': '活跃', en: 'Active' },
  'projects.status.wip': { 'zh-CN': '开发中', en: 'WIP' },
  'projects.status.archive': { 'zh-CN': '归档', en: 'Archive' },
  
  // 关于
  'about.title': { 'zh-CN': '关于 - Edward Chen', en: 'About - Edward Chen' },
  'about.meta': { 'zh-CN': '个人介绍 · 技能 · 经历', en: 'Introduction · Skills · Experience' },
  'about.intro1': { 'zh-CN': '你好！我是 Edward Chen，一名个人开发者、AI 爱好者和技术写作者。', en: 'Hello! I\'m Edward Chen, an independent developer, AI enthusiast, and technical writer.' },
  'about.intro2': { 'zh-CN': '我喜欢构建有趣的东西，探索人工智能的可能性，并分享我的学习旅程。这个博客是我记录技术笔记、项目展示和思考的地方。', en: 'I love building interesting things, exploring AI possibilities, and sharing my learning journey. This blog is where I record technical notes, showcase projects, and share my thoughts.' },
  'about.techStack': { 'zh-CN': '技术栈', en: 'Tech Stack' },
  'about.contact': { 'zh-CN': '联系方式', en: 'Contact' },
  
  // 设置
  'settings.theme': { 'zh-CN': '主题', en: 'Theme' },
  'settings.theme.light': { 'zh-CN': '浅色', en: 'Light' },
  'settings.theme.dark': { 'zh-CN': '深色', en: 'Dark' },
  'settings.theme.auto': { 'zh-CN': '跟随系统', en: 'Auto' },
  'settings.typeface': { 'zh-CN': '字体', en: 'Typeface' },
  'settings.typeface.sans': { 'zh-CN': '无衬线', en: 'Sans' },
  'settings.typeface.serif': { 'zh-CN': '衬线', en: 'Serif' },
  'settings.density': { 'zh-CN': '密度', en: 'Density' },
  'settings.density.compact': { 'zh-CN': '紧凑', en: 'Compact' },
  'settings.density.normal': { 'zh-CN': '正常', en: 'Normal' },
  'settings.density.comfy': { 'zh-CN': '宽松', en: 'Comfy' },
  'settings.language': { 'zh-CN': '语言', en: 'Language' },
  'settings.language.zh-CN': { 'zh-CN': '简体中文', en: '中文' },
  'settings.language.en': { 'zh-CN': 'English', en: 'English' },
  
  // 通用
  'common.unpublished': { 'zh-CN': '未发布', en: 'Unpublished' },
  'common.yearMonth': { 'zh-CN': '{year}年{month}月', en: '{month} {year}' },
  
  // 文章详情页
  'post.readTime': { 'zh-CN': '约 {minutes} 分钟阅读', en: 'About {minutes} min read' },
  'post.related': { 'zh-CN': '相关文章', en: 'Related Posts' },
  'post.prev': { 'zh-CN': '上一篇：{title}', en: 'Previous: {title}' },
  'post.next': { 'zh-CN': '下一篇：{title}', en: 'Next: {title}' },
  'post.backToList': { 'zh-CN': '返回文章列表', en: 'Back to List' },
};

/**
 * 获取翻译文本
 */
export function t(key: string, lang: Language = 'zh-CN', params?: Record<string, string | number>): string {
  let text = translations[key]?.[lang] || key;
  
  // 替换参数
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  
  return text;
}

/**
 * 获取当前语言
 * @param isClient 是否在客户端
 */
export function getCurrentLang(isClient = true): Language {
  if (isClient) {
    const saved = localStorage.getItem('edwardchen-lang') as Language;
    if (saved && (saved === 'zh-CN' || saved === 'en')) {
      return saved;
    }
    
    // 默认使用浏览器语言
    const browserLang = navigator.language;
    return browserLang.startsWith('zh') ? 'zh-CN' : 'en';
  }
  
  // 服务端默认返回 zh-CN
  return 'zh-CN';
}

/**
 * 设置语言
 */
export function setLang(lang: Language) {
  localStorage.setItem('edwardchen-lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.setAttribute('data-lang', lang);
}
