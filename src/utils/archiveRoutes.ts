import config from '~/config/config.json';
import { BLOG_BASE, CATEGORY_BASE, TAG_BASE, trimSlash } from '~/utils/permalinks';

const { default_language, default_language_in_subdir } = config.settings;
const EVENTS_BASE = 'events';

const joinPath = (...segments: Array<string | undefined>) =>
  segments
    .map((segment) => trimSlash(segment || ''))
    .filter(Boolean)
    .join('/');

const isDefaultLanguageAtRoot = (lang: string) => lang === default_language && !default_language_in_subdir;

const getLanguagePrefix = (lang?: string) => {
  const resolvedLang = lang || default_language;
  return isDefaultLanguageAtRoot(resolvedLang) ? '' : resolvedLang;
};

export const BLOCKED_ROOT_BLOG_CATEGORY_REDIRECTS: Record<string, string> = {
  'abd-vize-reddi-reddetme-ve-iade': 'tr/category/abd-vize-reddi-reddetme-ve-iade',
  'affirmative-asylum': 'affirmative-asylum',
  'amerika-vizesi': 'tr/category/amerika-vizesi',
  'amerikada-egitim': 'tr/blog',
  'amerikada-oturma-izni': 'tr/blog',
  'estate-planning': 'what-is-estate-planning-in-the-us',
  'eu-citizenship': 'path-to-us-citizenship-requirements-for-eu-citizenship',
  'form-kilavuzu': 'tr/blog',
  'gocmenlik-hukuku': 'tr/category/gocmenlik-hukuku',
  'gocmenlik-ve-mesleki-lisanslama': 'tr/category/gocmenlik-ve-mesleki-lisanslama',
  'green-card-basvurusu': 'tr/category/green-card-basvurusu',
  'i-130': 'whatis-form-i-130-2025-update',
  'immigration-mandamus-lawsuits': 'immigration-mandamus-lawsuits',
  'removal-proceedings': 'removal-proceedings',
  'visa': 'understanding-the-h-1b-visa-process',
  'vize-and-green-card': 'tr/category/vize-and-green-card',
  'writ-of-mandamus': 'whatis-a-writ-ofmandamus',
};

const BLOCKED_TURKISH_BLOG_CATEGORY_SLUGS = [
  'affirmative-asylum',
  'business-immigration',
  'business-law',
  'business-litigation',
  'citizenship-and-military-service',
  'estate-planning',
  'eu-citizenship',
  'form-guide',
  'green-card-and-immigration-and-visa-news',
  'green-card-process',
  'i-130',
  'immigrant-visas',
  'immigration-and-professional-licensing',
  'immigration-mandamus-lawsuits',
  'intellectual-property',
  'intellectual-property-law',
  'investment-visa',
  'law-partner',
  'legal-advice',
  'real-estate',
  'real-estate-law',
  'removal-asylum',
  'removal-proceedings',
  'student-visa',
  'us-visa-denials-refusals-and-rejections',
  'usa-news',
  'valid-will',
  'visa',
  'visa-application',
  'visa-refused',
  'writ-of-mandamus',
] as const;

export const BLOCKED_TURKISH_BLOG_CATEGORY_REDIRECTS: Record<string, string> = Object.fromEntries(
  BLOCKED_TURKISH_BLOG_CATEGORY_SLUGS.map((slug) => [slug, BLOCKED_ROOT_BLOG_CATEGORY_REDIRECTS[slug] ?? `category/${slug}`])
);

export const BLOCKED_ROOT_EVENT_CATEGORY_REDIRECTS: Record<string, string> = {
  'anniversary-event': 'events/us-250th-anniversary-celebration',
  'world-cup-event': 'events/fifa-world-cup-2026-community-event',
};

export const BLOCKED_ROOT_EVENT_TAG_REDIRECTS: Record<string, string> = {
  'world-cup-2026': 'events/fifa-world-cup-2026-community-event',
};

export const shouldGenerateBlogCategoryRoute = (slug: string, lang: string) =>
  !(isDefaultLanguageAtRoot(lang) && slug in BLOCKED_ROOT_BLOG_CATEGORY_REDIRECTS) &&
  !(lang === 'tr' && slug in BLOCKED_TURKISH_BLOG_CATEGORY_REDIRECTS);

export const shouldGenerateEventCategoryRoute = (slug: string, lang: string) =>
  !(isDefaultLanguageAtRoot(lang) && slug in BLOCKED_ROOT_EVENT_CATEGORY_REDIRECTS);

export const shouldGenerateEventTagRoute = (slug: string, lang: string) =>
  !(isDefaultLanguageAtRoot(lang) && slug in BLOCKED_ROOT_EVENT_TAG_REDIRECTS);

export const resolveBlogIndexPath = (lang?: string) => {
  if (!BLOG_BASE) return undefined;
  return joinPath(getLanguagePrefix(lang), BLOG_BASE);
};

export const resolveEventsIndexPath = (lang?: string) => joinPath(getLanguagePrefix(lang), EVENTS_BASE);

export const resolveBlogCategoryArchivePath = (slug: string, lang?: string) => {
  const resolvedLang = lang || default_language;
  if (isDefaultLanguageAtRoot(resolvedLang) && BLOCKED_ROOT_BLOG_CATEGORY_REDIRECTS[slug]) {
    return BLOCKED_ROOT_BLOG_CATEGORY_REDIRECTS[slug];
  }
  if (resolvedLang === 'tr' && BLOCKED_TURKISH_BLOG_CATEGORY_REDIRECTS[slug]) {
    return BLOCKED_TURKISH_BLOG_CATEGORY_REDIRECTS[slug];
  }
  if (!CATEGORY_BASE) return resolveBlogIndexPath(resolvedLang);
  return joinPath(getLanguagePrefix(resolvedLang), CATEGORY_BASE, slug);
};

export const resolveBlogTagArchivePath = (slug: string, lang?: string) => {
  const resolvedLang = lang || default_language;
  if (!TAG_BASE) return resolveBlogIndexPath(resolvedLang);
  return joinPath(getLanguagePrefix(resolvedLang), TAG_BASE, slug);
};

export const resolveEventCategoryArchivePath = (slug: string, lang?: string) => {
  const resolvedLang = lang || default_language;
  if (isDefaultLanguageAtRoot(resolvedLang) && BLOCKED_ROOT_EVENT_CATEGORY_REDIRECTS[slug]) {
    return BLOCKED_ROOT_EVENT_CATEGORY_REDIRECTS[slug];
  }
  return joinPath(getLanguagePrefix(resolvedLang), EVENTS_BASE, 'category', slug);
};

export const resolveEventTagArchivePath = (slug: string, lang?: string) => {
  const resolvedLang = lang || default_language;
  if (isDefaultLanguageAtRoot(resolvedLang) && BLOCKED_ROOT_EVENT_TAG_REDIRECTS[slug]) {
    return BLOCKED_ROOT_EVENT_TAG_REDIRECTS[slug];
  }
  return joinPath(getLanguagePrefix(resolvedLang), EVENTS_BASE, 'tag', slug);
};
