import type { Post } from '~/types';
import { fetchPosts } from '~/utils/blog';
import { pickServiceSlug } from '~/utils/relatedService';
import config from '~/config/config.json';

/**
 * Picks blog posts that are relevant to a practice-area page (or to another post).
 * Ranking, highest first: hand-picked links from the page's seo.strategy.internalLinks,
 * posts whose `service` field names the page, posts whose category maps to the page,
 * keyword matches in title / excerpt / category / tags, then the latest posts as filler.
 * Results are always limited to the requested language.
 */

const DEFAULT_LANG: string = config.settings.default_language;

const postMatchesLang = (post: Post, lang: string): boolean => {
  const postLang = post.lang;
  if (Array.isArray(postLang)) return postLang.includes(lang);
  if (typeof postLang === 'string') return postLang === lang;
  return lang === DEFAULT_LANG;
};

/** Extra search terms per service slug (lower case; any language). */
const KEYWORDS: Record<string, string[]> = {
  'eb-2-niw-green-card': ['niw', 'national interest', 'eb-2', 'eb2', 'self-petition'],
  'eb-1-green-card': ['eb-1', 'eb1', 'extraordinary', 'outstanding', 'multinational'],
  'eb-1a-green-card': ['eb-1a', 'eb1a', 'extraordinary ability'],
  'eb-1b-green-card': ['eb-1b', 'eb1b', 'outstanding professor', 'outstanding researcher'],
  'eb-1c-green-card': ['eb-1c', 'eb1c', 'multinational manager'],
  'o-1a-visa': ['o-1', 'o1 visa', 'extraordinary ability'],
  'o-1b-visa': ['o-1', 'o1 visa', 'artist', 'entertain'],
  'h-1b-visa': ['h-1b', 'h1b', 'specialty occupation'],
  'l-1a-visa': ['l-1', 'l1 visa', 'intracompany'],
  'l-1b-visa': ['l-1', 'l1 visa', 'specialized knowledge'],
  'e-2-visa': ['e-2', 'e2 visa', 'treaty investor', 'investment visa', 'yatırım'],
  'e-1-visa': ['e-1', 'treaty trader'],
  'eb-5-green-card': ['eb-5', 'eb5', 'investor green card'],
  'f-1-visa': ['f-1', 'student visa', 'öğrenci', 'estudiante', 'university', 'üniversite'],
  'j-1-visa': ['j-1', 'exchange visitor'],
  'tn-visa': ['tn visa', 'usmca', 'nafta'],
  'family-based-immigration': ['family', 'i-130', 'spouse', 'aile', 'familia', 'família', 'famille'],
  'marriage-based-green-card': ['marriage', 'spouse', 'married', 'evlilik', 'matrimonio', 'casamento', 'mariage'],
  'green-card-for-parents': ['parent', 'children', 'anne', 'baba', 'padres', 'pais'],
  'child-green-card': ['child', 'children', 'çocuk', 'hijo', 'filho', 'enfant', 'cspa', 'age out'],
  'sibling-green-card': ['sibling', 'brother', 'sister', 'kardeş', 'hermano', 'irmão', 'f4'],
  'k-1-fiance-visa': ['fiancé', 'fiance', 'k-1', 'k1 visa', 'nişanlı', 'prometido', 'noivo'],
  'family-reunification': ['reunification', 'reunite', 'bringing your family', 'i-730', 'parole', 'aile'],
  'affirmative-asylum-applications': ['asylum', 'i-589', 'iltica', 'asilo', 'asile', 'persecution'],
  'green-card-through-asylum': ['asylum', 'asylee', 'iltica', 'asilo', 'refugee'],
  'special-immigrant-juvenile-status': ['juvenile', 'sijs', 'minor', 'abandon', 'neglect'],
  'u-visa-vawa-humanitarian-protection': [
    'u visa',
    'u-visa',
    'vawa',
    't visa',
    'trafficking',
    'domestic violence',
    'tps',
  ],
  'removal-defense': ['removal', 'deportation', 'immigration court', 'sınır dışı', 'deportación', 'deportação'],
  'immigration-detention-and-bond': ['detention', 'detained', 'ice', 'bond', 'gözaltı'],
  'habeas-corpus': ['habeas', 'detention', 'detained', 'custody', 'ice'],
  'bia-appeals-and-motions': ['appeal', 'bia', 'motion to reopen', 'reconsider', 'temyiz'],
  'immigration-litigation': ['denial', 'denied', 'refused', 'lawsuit', 'federal court', 'ret', 'reddedil'],
  'immigration-mandamus': ['mandamus', 'delay', 'delayed', 'gecikme'],
  'citizenship-and-naturalization': [
    'citizenship',
    'naturalization',
    'n-400',
    'citizen',
    'vatandaş',
    'ciudadan',
    'cidadan',
    'citoyen',
  ],
  'change-and-extension-of-status': ['change of status', 'extension', 'i-539', 'extend', 'overstay'],
  'travel-and-reentry-permits': ['advance parole', 're-entry', 'reentry', 'travel document', 'abandon', 'travel'],
  'foia-requests': ['foia', 'records', 'a-file', 'case file'],
  'business-employment-immigration-solutions': [
    'employer',
    'sponsor',
    'perm',
    'labor certification',
    'work visa',
    'çalışma',
  ],
  'trademark-and-intellectual-property-registration': ['trademark', 'marka', 'marca', 'brand', 'intellectual property'],
  'trademark-search-and-clearance': ['trademark', 'clearance', 'marka', 'marca', 'brand'],
  'trademark-office-action-responses': ['trademark', 'office action', 'uspto', 'marka'],
  'trademark-enforcement-and-ttab-proceedings': ['trademark', 'infringement', 'counterfeit', 'ttab', 'marka'],
  'trademark-renewal-and-international-registration': ['trademark', 'madrid', 'renewal', 'marka'],
  'copyright-registration': ['copyright', 'telif'],
  'trade-secret-protection': ['trade secret'],
  'ip-litigation-and-dispute-resolution': ['infringement', 'intellectual property', 'ip'],
  'ip-portfolio-management': ['intellectual property', 'portfolio', 'trademark'],
  'ip-law': ['intellectual property', 'trademark', 'copyright', 'marka', 'fikri'],
  'business-corporate-law': ['business', 'company', 'corporate', 'llc', 'şirket', 'empresa', 'entreprise'],
  'business-formation-structuring': ['formation', 'llc', 'incorporat', 'sole proprietorship', 'şirket kur'],
  'general-counsel-services': ['general counsel', 'legal advisor', 'business'],
  'estate-planning': ['estate', 'will', 'trust', 'probate', 'miras', 'vasiyet', 'herencia', 'testamento'],
  'wills-trusts-probate-administration': ['will', 'trust', 'probate', 'vasiyet', 'testamento'],
  'estate-planning-asset-protection': ['estate', 'asset protection', 'trust', 'miras'],
  'legal-guardianship': ['guardianship', 'guardian'],
  'real-estate': ['real estate', 'property', 'home', 'house', 'gayrimenkul', 'inmueble', 'imóvel'],
  'personal-injury-law': ['injury', 'accident', 'negligence', 'wrongful death'],
  'immigration-law': ['immigration', 'visa', 'green card', 'göçmen', 'vize', 'inmigra', 'imigra', 'uscis'],
};

const STOP_WORDS = new Set([
  'and',
  'the',
  'for',
  'green',
  'card',
  'visa',
  'immigration',
  'attorney',
  'services',
  'solutions',
  'based',
  'law',
  'legal',
  'status',
  'protection',
  'registration',
  'key',
  'with',
  'through',
]);

const keywordsFor = (slug: string): string[] =>
  KEYWORDS[slug] ?? slug.split('-').filter((word) => word.length > 2 && !STOP_WORDS.has(word));

const searchTextOf = (post: Post): string =>
  [post.title, post.excerpt, post.category?.title, ...(post.tags ?? []).map((tag) => tag.title)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

/** Keywords that name a specific visa or form (contain a digit, e.g. "eb-1a", "i-589") are strong signals. */
const keywordWeight = (keyword: string, inTitle: boolean): number => {
  const base = /\d/.test(keyword) ? 30 : keyword.length > 3 ? 10 : 5;
  return inTitle ? base * 2 : base;
};

export const scorePostForService = (post: Post, slug: string): number => {
  let score = 0;
  if (post.service && post.service.trim() === slug) score += 100;
  if (pickServiceSlug(post) === slug) score += 15;
  const title = (post.title ?? '').toLowerCase();
  const text = searchTextOf(post);
  for (const keyword of keywordsFor(slug)) {
    const needle = keyword.toLowerCase();
    if (title.includes(needle)) score += keywordWeight(keyword, true);
    else if (text.includes(needle)) score += keywordWeight(keyword, false);
  }
  return score;
};

const slugFromLink = (link: string): string | undefined => {
  const path = link
    .replace(/^https?:\/\/[^/]+/i, '')
    .split(/[?#]/)[0]
    .replace(/^\/+|\/+$/g, '');
  return path.split('/').pop() || undefined;
};

export interface ServicePostsOptions {
  slug: string;
  lang?: string;
  count?: number;
  /** Hand-picked post URLs or slugs, shown first (e.g. seo.strategy.internalLinks). */
  pinned?: string[];
  /** Slug of a post to leave out (the post being read). */
  excludeSlug?: string;
}

export const getPostsForService = async ({
  slug,
  lang = DEFAULT_LANG,
  count = 4,
  pinned = [],
  excludeSlug,
}: ServicePostsOptions): Promise<Post[]> => {
  const posts = (await fetchPosts()).filter((post) => postMatchesLang(post, lang) && post.slug !== excludeSlug);

  const pinnedSlugs = pinned.map(slugFromLink).filter((value): value is string => Boolean(value));
  const pinnedPosts = pinnedSlugs
    .map((pinnedSlug) => posts.find((post) => post.slug === pinnedSlug || post.permalink === pinnedSlug))
    .filter((post): post is Post => Boolean(post));

  const ranked = posts
    .filter((post) => !pinnedPosts.includes(post))
    .map((post) => ({ post, score: scorePostForService(post, slug) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.post.publishDate.valueOf() - a.post.publishDate.valueOf())
    .map(({ post }) => post);

  const result: Post[] = [...pinnedPosts, ...ranked];
  for (const post of posts) {
    if (result.length >= count) break;
    if (!result.includes(post)) result.push(post);
  }
  return result.slice(0, count);
};

/**
 * Posts similar to the one being read: same service first, then same category,
 * shared tags and keyword overlap, filled with the latest posts in the same language.
 */
export const getSimilarPosts = async (original: Post, lang: string = DEFAULT_LANG, count = 4): Promise<Post[]> => {
  const serviceSlug = pickServiceSlug(original);
  const posts = (await fetchPosts()).filter((post) => postMatchesLang(post, lang) && post.slug !== original.slug);
  const originalTags = new Set((original.tags ?? []).map((tag) => tag.slug));

  const ranked = posts
    .map((post) => {
      let score = scorePostForService(post, serviceSlug);
      if (post.category && original.category && post.category.slug === original.category.slug) score += 20;
      for (const tag of post.tags ?? []) if (originalTags.has(tag.slug)) score += 5;
      return { post, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.post.publishDate.valueOf() - a.post.publishDate.valueOf())
    .map(({ post }) => post);

  for (const post of posts) {
    if (ranked.length >= count) break;
    if (!ranked.includes(post)) ranked.push(post);
  }
  return ranked.slice(0, count);
};

export const RELATED_POSTS_COPY: Record<string, { title: string; link: string; postTitle: string }> = {
  en: { title: 'Related articles', link: 'View all posts', postTitle: 'Related posts' },
  tr: { title: 'İlgili yazılar', link: 'Tüm yazıları görün', postTitle: 'Benzer yazılar' },
  es: { title: 'Artículos relacionados', link: 'Ver todas las entradas', postTitle: 'Entradas similares' },
  pt: { title: 'Artigos relacionados', link: 'Ver todos os posts', postTitle: 'Posts semelhantes' },
  fr: { title: 'Articles associés', link: 'Voir tous les articles', postTitle: 'Articles similaires' },
};
