export const SEO_LANGS = ['en', 'tr', 'es', 'pt', 'fr'] as const;

export type SeoLang = (typeof SEO_LANGS)[number];

export const DEFAULT_SEO_LANG: SeoLang = 'en';

export const OG_LOCALE_BY_LANG: Record<SeoLang, string> = {
  en: 'en_US',
  tr: 'tr_TR',
  es: 'es_ES',
  pt: 'pt_PT',
  fr: 'fr_FR',
};

export const HREFLANG_BY_LANG: Record<SeoLang, string> = {
  en: 'en',
  tr: 'tr',
  es: 'es',
  pt: 'pt',
  fr: 'fr',
};

export interface SeoBusinessData {
  name: string;
  legalName: string;
  siteUrl: string;
  telephone: string;
  logoPath: string;
  sameAs: string[];
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
}

export const SEO_BUSINESS: SeoBusinessData = {
  name: 'Capitol Law Partners',
  legalName: 'Capitol Law Partners LLC',
  siteUrl: 'https://capitollawpartners.com',
  telephone: '+1-202-440-2272',
  logoPath: '/_astro/favicon.BotMtrnE.svg',
  sameAs: [
    'https://www.instagram.com/capitollawpartners/',
    'https://www.facebook.com/CapitolLaw/',
    'https://www.linkedin.com/company/capitollawpartners',
  ],
  address: {
    streetAddress: '1200 G Street NW, Suite 800',
    addressLocality: 'Washington',
    addressRegion: 'DC',
    postalCode: '20005',
    addressCountry: 'US',
  },
};

const NON_LOCALIZED_PREFIXES = ['/admin', '/api', '/terms', '/404'];

const normalizePathname = (pathname: string): string => {
  if (!pathname) return '/';

  let value = pathname.trim();
  if (!value.startsWith('/')) value = `/${value}`;

  value = value.replace(/\/+/g, '/');

  if (value.length > 1 && value.endsWith('/')) {
    value = value.slice(0, -1);
  }

  return value || '/';
};

const toSeoLang = (lang: string): SeoLang | undefined => {
  return SEO_LANGS.find((supportedLang) => supportedLang === lang.toLowerCase()) as SeoLang | undefined;
};

export const getLangFromPathname = (pathname: string, defaultLang: SeoLang = DEFAULT_SEO_LANG): SeoLang => {
  const normalizedPath = normalizePathname(pathname);
  const [, firstSegment = ''] = normalizedPath.split('/');

  return toSeoLang(firstSegment) ?? defaultLang;
};

export const stripLangPrefix = (pathname: string, defaultLang: SeoLang = DEFAULT_SEO_LANG) => {
  const normalizedPath = normalizePathname(pathname);
  const segments = normalizedPath.split('/').filter(Boolean);
  const firstSegment = segments[0] ? toSeoLang(segments[0]) : undefined;

  if (firstSegment) {
    const routePath = `/${segments.slice(1).join('/')}`.replace(/\/+/g, '/');
    return {
      lang: firstSegment,
      routePath: routePath === '/' || routePath === '' ? '/' : routePath,
      hadLangPrefix: true,
    };
  }

  return {
    lang: defaultLang,
    routePath: normalizedPath,
    hadLangPrefix: false,
  };
};

export const buildPathForLang = (routePath: string, lang: SeoLang, defaultLang: SeoLang = DEFAULT_SEO_LANG) => {
  const normalizedRoutePath = normalizePathname(routePath);

  if (lang === defaultLang) {
    return normalizedRoutePath;
  }

  if (normalizedRoutePath === '/') {
    return `/${lang}`;
  }

  return `/${lang}${normalizedRoutePath}`;
};

export const getOgLocaleForLang = (lang: string): string => {
  const resolvedLang = toSeoLang(lang) ?? DEFAULT_SEO_LANG;
  return OG_LOCALE_BY_LANG[resolvedLang];
};

export const getAlternateOgLocales = (lang: string): string[] => {
  const currentLocale = getOgLocaleForLang(lang);
  return Object.values(OG_LOCALE_BY_LANG).filter((locale) => locale !== currentLocale);
};

export const getAlternateOgLocalesForLangs = (
  lang: string,
  languages: readonly string[],
  includeDefault = true
): string[] => {
  const currentLocale = getOgLocaleForLang(lang);
  const locales = toUniqueSeoLangs(languages, DEFAULT_SEO_LANG, includeDefault).map(
    (language) => OG_LOCALE_BY_LANG[language]
  );
  return Array.from(new Set(locales)).filter((locale) => locale !== currentLocale);
};

export interface HreflangAlternate {
  hreflang: string;
  href: string;
}

const toUniqueSeoLangs = (
  languages: readonly string[],
  defaultLang: SeoLang = DEFAULT_SEO_LANG,
  includeDefault = true
): SeoLang[] => {
  const normalized = languages
    .map((lang) => toSeoLang(lang))
    .filter((lang): lang is SeoLang => Boolean(lang));

  if (includeDefault && !normalized.includes(defaultLang)) {
    normalized.unshift(defaultLang);
  }

  return Array.from(new Set(normalized));
};

export const buildLanguageAlternates = (
  pathname: string,
  siteUrl: string,
  defaultLang: SeoLang = DEFAULT_SEO_LANG
): HreflangAlternate[] => {
  const normalizedPath = normalizePathname(pathname);

  if (NON_LOCALIZED_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))) {
    return [];
  }

  const { routePath } = stripLangPrefix(normalizedPath, defaultLang);
  if (NON_LOCALIZED_PREFIXES.some((prefix) => routePath.startsWith(prefix))) {
    return [];
  }
  const links: HreflangAlternate[] = SEO_LANGS.map((lang) => ({
    hreflang: HREFLANG_BY_LANG[lang],
    href: new URL(buildPathForLang(routePath, lang, defaultLang), siteUrl).toString(),
  }));

  links.push({
    hreflang: 'x-default',
    href: new URL(buildPathForLang(routePath, defaultLang, defaultLang), siteUrl).toString(),
  });

  return links;
};

export const buildLanguageAlternatesForLangs = (
  routePath: string,
  siteUrl: string,
  languages: readonly string[],
  defaultLang: SeoLang = DEFAULT_SEO_LANG,
  includeDefault = true
): HreflangAlternate[] => {
  const resolvedLangs = toUniqueSeoLangs(languages, defaultLang, includeDefault);
  const xDefaultLang = resolvedLangs.includes(defaultLang) ? defaultLang : resolvedLangs[0] ?? defaultLang;

  const links: HreflangAlternate[] = resolvedLangs.map((lang) => ({
    hreflang: HREFLANG_BY_LANG[lang],
    href: new URL(buildPathForLang(routePath, lang, defaultLang), siteUrl).toString(),
  }));

  links.push({
    hreflang: 'x-default',
    href: new URL(buildPathForLang(routePath, xDefaultLang, defaultLang), siteUrl).toString(),
  });

  return links;
};

export const titleCaseFromSlug = (segment: string): string => {
  if (!segment) return '';

  return segment
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
};

export interface CanonicalSanitizeOptions {
  siteUrl: string;
  forceHost?: string;
}

export const sanitizeCanonicalUrl = (
  rawCanonical: string | undefined,
  options: CanonicalSanitizeOptions
): string | undefined => {
  if (!rawCanonical || typeof rawCanonical !== 'string') return undefined;

  const trimmedCanonical = rawCanonical
    .trim()
    .replace(/\u00a0/g, '')
    .replace(/\s+/g, '-');

  if (!trimmedCanonical) return undefined;

  try {
    const url = new URL(trimmedCanonical, options.siteUrl);
    url.protocol = 'https:';

    if (options.forceHost) {
      url.hostname = options.forceHost;
    }

    url.search = '';
    url.hash = '';

    const normalizedPath = normalizePathname(url.pathname).toLowerCase();
    url.pathname = normalizedPath;

    return url.toString();
  } catch {
    return undefined;
  }
};
