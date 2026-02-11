import type { SeoData, MetaData } from '~/types';
import {
  buildLanguageAlternates,
  getAlternateOgLocales,
  getLangFromPathname,
  getOgLocaleForLang,
  sanitizeCanonicalUrl,
  stripLangPrefix,
  titleCaseFromSlug,
  type HreflangAlternate,
} from '~/data/seo';

export type SeoPageType = 'website' | 'webpage' | 'article' | 'blog' | 'profile' | 'service';

export interface SeoArticleData {
  title: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  articleSection?: string;
  keywords?: string[];
}

export interface ResolveSeoInput {
  pathname: string;
  siteUrl: string;
  metadata?: MetaData;
  seo?: SeoData;
  pageType?: SeoPageType;
  languageAlternates?: HreflangAlternate[];
  ogLocaleAlternates?: string[];
}

export interface ResolvedSeoData {
  lang: string;
  canonical: string;
  title?: string;
  description?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogImage?: string;
  ogType: 'website' | 'article';
  ogLocale: string;
  ogLocaleAlternates: string[];
  languageAlternates: HreflangAlternate[];
}

const segmentLabelMap: Record<string, string> = {
  'practice-area': 'Practice Areas',
  'key-services': 'Key Services',
  'our-team': 'Our Team',
  blog: 'Blog',
  category: 'Category',
  tag: 'Tag',
};

export const resolveSeo = ({
  pathname,
  siteUrl,
  metadata = {},
  seo = {},
  pageType = 'webpage',
  languageAlternates,
  ogLocaleAlternates,
}: ResolveSeoInput): ResolvedSeoData => {
  const siteHost = new URL(siteUrl).hostname;
  const lang = getLangFromPathname(pathname);

  const canonical = sanitizeCanonicalUrl(seo.canonicalOverride ?? metadata.canonical ?? pathname, {
    siteUrl,
    forceHost: siteHost,
  }) ?? new URL(pathname, siteUrl).toString();

  const noindex = typeof seo.noindex === 'boolean' ? seo.noindex : metadata.robots?.index === false;
  const nofollow = typeof seo.nofollow === 'boolean' ? seo.nofollow : metadata.robots?.follow === false;
  const title = seo.title ?? metadata.title;
  const description = seo.description ?? metadata.description;
  const ogImage = seo.ogImage ?? metadata.openGraph?.images?.[0]?.url;
  const ogType = pageType === 'article' ? 'article' : 'website';
  const ogLocale = metadata.openGraph?.locale ?? getOgLocaleForLang(lang);

  return {
    lang,
    canonical,
    title,
    description,
    noindex,
    nofollow,
    ogImage,
    ogType,
    ogLocale,
    languageAlternates: languageAlternates ?? buildLanguageAlternates(pathname, siteUrl),
    ogLocaleAlternates: ogLocaleAlternates ?? getAlternateOgLocales(lang),
  };
};

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export const buildBreadcrumbItemsFromPath = ({
  pathname,
  siteUrl,
  lastSegmentTitle,
}: {
  pathname: string;
  siteUrl: string;
  lastSegmentTitle?: string;
}): BreadcrumbItem[] => {
  const { lang, routePath } = stripLangPrefix(pathname);
  const items: BreadcrumbItem[] = [{ name: 'Home', url: new URL(lang === 'en' ? '/' : `/${lang}`, siteUrl).toString() }];

  const segments = routePath.split('/').filter(Boolean);
  let accPath = '';

  segments.forEach((segment, index) => {
    accPath += `/${segment}`;
    const localizedPath = lang === 'en' ? accPath : `/${lang}${accPath}`;
    const isLast = index === segments.length - 1;

    items.push({
      name: isLast && lastSegmentTitle ? lastSegmentTitle : segmentLabelMap[segment] ?? titleCaseFromSlug(segment),
      url: new URL(localizedPath, siteUrl).toString(),
    });
  });

  return items;
};
