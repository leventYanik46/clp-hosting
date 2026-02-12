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

const HREFLANG_PATTERN = /^(x-default|[a-z]{2,3}(?:-[a-z0-9]{2,8})*)$/i;

const sanitizeLanguageAlternates = ({
  languageAlternates,
  pathname,
  siteUrl,
}: {
  languageAlternates?: HreflangAlternate[];
  pathname: string;
  siteUrl: string;
}): HreflangAlternate[] => {
  const fallbackAlternates = buildLanguageAlternates(pathname, siteUrl);
  const fallbackByLang = new Map(fallbackAlternates.map((item) => [item.hreflang, item.href]));
  const normalized = (languageAlternates ?? [])
    .filter((item): item is HreflangAlternate => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      hreflang: String(item.hreflang ?? '').trim().toLowerCase(),
      href: String(item.href ?? '').trim(),
    }))
    .filter((item) => item.hreflang.length > 0 && item.href.length > 0 && HREFLANG_PATTERN.test(item.hreflang))
    .map((item) => {
      try {
        return {
          hreflang: item.hreflang,
          href: new URL(item.href, siteUrl).toString(),
        };
      } catch {
        return undefined;
      }
    })
    .filter((item): item is HreflangAlternate => Boolean(item));

  if (normalized.length === 0) {
    return fallbackAlternates;
  }

  const dedupedByLang = new Map<string, string>();
  for (const item of normalized) {
    dedupedByLang.set(item.hreflang, item.href);
  }

  const routeLang = getLangFromPathname(pathname);
  const requiredLangs = [routeLang, 'x-default'];
  for (const required of requiredLangs) {
    if (!dedupedByLang.has(required) && fallbackByLang.has(required)) {
      dedupedByLang.set(required, fallbackByLang.get(required)!);
    }
  }

  return Array.from(dedupedByLang.entries()).map(([hreflang, href]) => ({ hreflang, href }));
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
  const resolvedLanguageAlternates = sanitizeLanguageAlternates({
    languageAlternates: languageAlternates ?? buildLanguageAlternates(pathname, siteUrl),
    pathname,
    siteUrl,
  });

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
    languageAlternates: resolvedLanguageAlternates,
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
