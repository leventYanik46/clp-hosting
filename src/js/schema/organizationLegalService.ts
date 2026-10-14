import { SEO_BUSINESS, SEO_OFFICES, SEO_AREA_SERVED, SEO_KNOWS_LANGUAGE, type SeoOffice } from '~/data/seo';

const getSiteOrigin = (siteUrl: string) => {
  const url = new URL(siteUrl);
  return `${url.protocol}//${url.host}`;
};

export const getOfficeId = (office: SeoOffice, origin: string) => `${origin}${office.pagePath}#office`;

const toPostalAddress = (office: SeoOffice) => ({
  '@type': 'PostalAddress',
  streetAddress: office.streetAddress,
  addressLocality: office.addressLocality,
  ...(office.addressRegion ? { addressRegion: office.addressRegion } : {}),
  postalCode: office.postalCode,
  addressCountry: office.addressCountry,
});

/** Every physical office as a schema.org Place, referenced from the Organization. */
export const getOfficePlaces = (siteUrl: string) => {
  const origin = getSiteOrigin(siteUrl);
  return SEO_OFFICES.map((office) => ({
    '@type': 'Place',
    '@id': getOfficeId(office, origin),
    name: office.name,
    url: `${origin}${office.pagePath}`,
    telephone: office.telephone,
    address: toPostalAddress(office),
    ...(office.geo
      ? { geo: { '@type': 'GeoCoordinates', latitude: office.geo.latitude, longitude: office.geo.longitude } }
      : {}),
    ...(office.mapUrl ? { hasMap: office.mapUrl } : {}),
  }));
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
    location: getOfficePlaces(siteUrl),
  };
};

/**
 * The firm as a local business. `Attorney` is the schema.org subtype of
 * LegalService meant for law firms; LocalBusiness is kept for older parsers.
 */
export const getLegalServiceSchema = (siteUrl: string) => {
  const origin = getSiteOrigin(siteUrl);

  return {
    '@context': 'https://schema.org',
    '@type': ['Attorney', 'LegalService', 'LocalBusiness'],
    '@id': `${origin}/#legal-service`,
    name: SEO_BUSINESS.name,
    url: origin,
    telephone: SEO_BUSINESS.telephone,
    sameAs: SEO_BUSINESS.sameAs,
    parentOrganization: { '@id': `${origin}/#organization` },
    address: {
      '@type': 'PostalAddress',
      ...SEO_BUSINESS.address,
    },
    location: SEO_OFFICES.map((office) => ({ '@id': getOfficeId(office, origin) })),
    areaServed: SEO_AREA_SERVED,
    knowsLanguage: SEO_KNOWS_LANGUAGE,
  };
};

/**
 * A single office as its own Attorney/LegalService node, for the office page.
 */
export const getOfficeAttorneySchema = (
  office: SeoOffice,
  siteUrl: string,
  extra: {
    description?: string;
    openingHours?: string[];
    areaServed?: string[];
    image?: string;
    email?: string;
  } = {}
) => {
  const origin = getSiteOrigin(siteUrl);
  const openingHoursSpecification = (extra.openingHours ?? [])
    .map((spec) => {
      const match = /^([A-Za-z]{2}(?:-[A-Za-z]{2})?)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(spec.trim());
      if (!match) return undefined;
      const [, days, opens, closes] = match;
      const dayNames: Record<string, string> = {
        Mo: 'Monday',
        Tu: 'Tuesday',
        We: 'Wednesday',
        Th: 'Thursday',
        Fr: 'Friday',
        Sa: 'Saturday',
        Su: 'Sunday',
      };
      const order = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
      const [start, end = start] = days.split('-');
      const startIdx = order.indexOf(start);
      const endIdx = order.indexOf(end);
      if (startIdx === -1 || endIdx === -1) return undefined;
      const dayOfWeek = order.slice(startIdx, endIdx + 1).map((d) => dayNames[d]);
      return { '@type': 'OpeningHoursSpecification', dayOfWeek, opens, closes };
    })
    .filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': ['Attorney', 'LegalService', 'LocalBusiness'],
    '@id': getOfficeId(office, origin),
    name: office.name,
    url: `${origin}${office.pagePath}`,
    telephone: office.telephone,
    ...(extra.email ? { email: extra.email } : {}),
    ...(extra.description ? { description: extra.description } : {}),
    ...(extra.image ? { image: extra.image } : {}),
    address: toPostalAddress(office),
    ...(office.geo
      ? { geo: { '@type': 'GeoCoordinates', latitude: office.geo.latitude, longitude: office.geo.longitude } }
      : {}),
    ...(office.mapUrl ? { hasMap: office.mapUrl } : {}),
    ...(openingHoursSpecification.length ? { openingHoursSpecification } : {}),
    areaServed: extra.areaServed ?? SEO_AREA_SERVED,
    knowsLanguage: SEO_KNOWS_LANGUAGE,
    parentOrganization: { '@id': `${origin}/#organization` },
    sameAs: SEO_BUSINESS.sameAs,
  };
};
