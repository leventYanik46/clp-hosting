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

export interface SeoOffice {
  /** Stable id; also the city slug used by /locations/<id> */
  id: string;
  name: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion?: string;
  postalCode: string;
  addressCountry: string;
  telephone: string;
  mapUrl?: string;
  geo?: { latitude: number; longitude: number };
  /** Path of the dedicated office page, relative to the site root. */
  pagePath: string;
}

/**
 * Physical offices. Keep this in sync with src/content/office/* and the
 * cards in src/content/locations/*. Coordinates are only set where the
 * site's own Google Maps links already carry them; do not guess the rest.
 */
export const SEO_OFFICES: SeoOffice[] = [
  {
    id: 'washington-dc',
    name: 'Capitol Law Partners - Washington, DC',
    streetAddress: '1200 G Street NW, Suite 800',
    addressLocality: 'Washington',
    addressRegion: 'DC',
    postalCode: '20005',
    addressCountry: 'US',
    telephone: '+1-202-440-2272',
    mapUrl:
      'https://www.google.com/maps/place/Capitol+Law+Partners/@38.8981849,-77.0307687,17z/data=!3m2!4b1!5s0x89b7b7bdf11bb751:0xf9b2c66482b778ff!4m6!3m5!1s0x89b7b79fdc4c0afd:0x70647fab40f6ef1b!8m2!3d38.8981808!4d-77.0281938!16s%2Fg%2F11y23hfk14',
    geo: { latitude: 38.8981808, longitude: -77.0281938 },
    pagePath: '/locations/washington-dc',
  },
  {
    id: 'herndon-va',
    name: 'Capitol Law Partners - Herndon, Virginia',
    streetAddress: '13873 Park Center Road, Suite 152',
    addressLocality: 'Herndon',
    addressRegion: 'VA',
    postalCode: '20171',
    addressCountry: 'US',
    telephone: '+1-202-440-2272',
    mapUrl: 'https://www.google.com/maps/place/Capitol+Law+Partners/data=!4m2!3m1!1s0x0:0xdd25a8b02491aacd',
    pagePath: '/locations/herndon-va',
  },
  {
    id: 'new-york',
    name: 'Capitol Law Partners - New York',
    streetAddress: '14 Wall Street, 20th Floor',
    addressLocality: 'New York',
    addressRegion: 'NY',
    postalCode: '10005',
    addressCountry: 'US',
    telephone: '+1-202-440-2272',
    mapUrl: 'https://www.google.com/maps/place/14+Wall+St+20th+Floor,+New+York,+NY+10005',
    pagePath: '/locations/new-york',
  },
  {
    id: 'minneapolis',
    name: 'Capitol Law Partners - Minneapolis',
    streetAddress: '5775 Wayzata Blvd',
    addressLocality: 'St. Louis Park',
    addressRegion: 'MN',
    postalCode: '55416',
    addressCountry: 'US',
    telephone: '+1-202-440-2272',
    mapUrl:
      'https://www.google.com/maps/place/5775+Wayzata+Blvd+Suite+700,+St+Louis+Park,+MN+55416/@44.9694331,-93.3824122,13.31z/data=!4m6!3m5!1s0x52b334bd9ceaaaab:0x6ad439e33864c71e!8m2!3d44.9688915!4d-93.3538241!16s%2Fg%2F11mhjvs72_',
    geo: { latitude: 44.9688915, longitude: -93.3538241 },
    pagePath: '/locations/minneapolis',
  },
  {
    id: 'istanbul',
    name: 'Capitol Law Partners - Istanbul',
    streetAddress: 'Trump Towers, Residence 2901',
    addressLocality: 'Şişli, İstanbul',
    postalCode: '34381',
    addressCountry: 'TR',
    telephone: '+1-202-440-2272',
    mapUrl: 'https://www.google.com/maps/place/Trump+Towers/data=!4m2!3m1!1s0x0:0x9ce9fcc6cd43250',
    pagePath: '/locations/istanbul',
  },
];

/** U.S. jurisdictions the firm serves, used for areaServed in structured data. */
export const SEO_AREA_SERVED = ['US', 'District of Columbia', 'Virginia', 'New York', 'Minnesota'];

export const SEO_KNOWS_LANGUAGE = ['en', 'tr', 'es', 'pt', 'fr'];

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

const withTrailingSlashForLocalizedHomeHreflang = (
  path: string,
  routePath: string,
  lang: SeoLang,
  defaultLang: SeoLang
): string => {
  const isHomeRoute = normalizePathname(routePath) === '/';
  if (isHomeRoute && lang !== defaultLang && !path.endsWith('/')) {
    return `${path}/`;
  }

  return path;
};

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
    href: new URL(
      withTrailingSlashForLocalizedHomeHreflang(buildPathForLang(routePath, lang, defaultLang), routePath, lang, defaultLang),
      siteUrl
    ).toString(),
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
    href: new URL(
      withTrailingSlashForLocalizedHomeHreflang(buildPathForLang(routePath, lang, defaultLang), routePath, lang, defaultLang),
      siteUrl
    ).toString(),
  }));

  links.push({
    hreflang: 'x-default',
    href: new URL(
      withTrailingSlashForLocalizedHomeHreflang(
        buildPathForLang(routePath, xDefaultLang, defaultLang),
        routePath,
        xDefaultLang,
        defaultLang
      ),
      siteUrl
    ).toString(),
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
