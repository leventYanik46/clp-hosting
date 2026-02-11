import { SEO_BUSINESS } from '~/data/seo';

const getSiteOrigin = (siteUrl: string) => {
  const url = new URL(siteUrl);
  return `${url.protocol}//${url.host}`;
};

export const getOrganizationSchema = (siteUrl: string) => {
  const origin = getSiteOrigin(siteUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: SEO_BUSINESS.name,
    legalName: SEO_BUSINESS.legalName,
    url: origin,
    logo: new URL(SEO_BUSINESS.logoPath, origin).toString(),
    telephone: SEO_BUSINESS.telephone,
    sameAs: SEO_BUSINESS.sameAs,
  };
};

export const getLegalServiceSchema = (siteUrl: string) => {
  const origin = getSiteOrigin(siteUrl);

  return {
    '@context': 'https://schema.org',
    '@type': ['LegalService', 'LocalBusiness'],
    '@id': `${origin}/#legal-service`,
    name: SEO_BUSINESS.name,
    url: origin,
    telephone: SEO_BUSINESS.telephone,
    sameAs: SEO_BUSINESS.sameAs,
    address: {
      '@type': 'PostalAddress',
      ...SEO_BUSINESS.address,
    },
    areaServed: ['US'],
    provider: {
      '@id': `${origin}/#organization`,
    },
  };
};
