import { SEO_BUSINESS } from '~/data/seo';

const getSiteOrigin = (siteUrl: string) => {
  const url = new URL(siteUrl);
  return `${url.protocol}//${url.host}`;
};

export const getWebsiteSchema = (siteUrl: string, language: string) => {
  const origin = getSiteOrigin(siteUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    url: origin,
    name: SEO_BUSINESS.name,
    inLanguage: language,
    publisher: {
      '@id': `${origin}/#organization`,
    },
  };
};
