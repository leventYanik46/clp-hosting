export interface PersonSchemaInput {
  name: string;
  description?: string;
  url: string;
  image?: string;
  jobTitle?: string;
  inLanguage?: string;
  givenName?: string;
  familyName?: string;
  honorificPrefix?: string;
  honorificSuffix?: string;
  alternateName?: string;
  email?: string;
  telephone?: string;
  sameAs?: string[];
  knowsAbout?: string[];
  knowsLanguage?: string[];
  alumniOf?: Array<
    | string
    | {
        name: string;
        url?: string;
        sameAs?: string;
        type?: 'EducationalOrganization' | 'CollegeOrUniversity' | 'School';
      }
  >;
  worksFor?: {
    id?: string;
    name?: string;
    url?: string;
    sameAs?: string[];
  };
  siteUrl: string;
}

export const getPersonSchema = ({
  name,
  description,
  url,
  image,
  jobTitle,
  inLanguage,
  givenName,
  familyName,
  honorificPrefix,
  honorificSuffix,
  alternateName,
  email,
  telephone,
  sameAs,
  knowsAbout,
  knowsLanguage,
  alumniOf,
  worksFor,
  siteUrl,
}: PersonSchemaInput) => {
  const origin = new URL(siteUrl).origin;
  const normalizedImage =
    typeof image === 'string'
      ? image.startsWith('http://') || image.startsWith('https://')
        ? image
        : image.startsWith('/')
          ? new URL(image, origin).toString()
          : undefined
      : undefined;

  const normalizedWorksFor =
    worksFor && (worksFor.id || worksFor.name || worksFor.url || worksFor.sameAs?.length)
      ? {
          '@type': 'Organization',
          ...(worksFor.id ? { '@id': worksFor.id } : {}),
          ...(worksFor.name ? { name: worksFor.name } : {}),
          ...(worksFor.url ? { url: worksFor.url } : {}),
          ...(worksFor.sameAs?.length ? { sameAs: worksFor.sameAs } : {}),
        }
      : {
          '@id': `${origin}/#organization`,
        };

  const normalizedAlumniOf = Array.isArray(alumniOf)
    ? alumniOf
        .map((item) => {
          if (typeof item === 'string') {
            return {
              '@type': 'EducationalOrganization',
              name: item,
            };
          }

          if (item?.name) {
            return {
              '@type': item.type ?? 'EducationalOrganization',
              name: item.name,
              ...(item.url ? { url: item.url } : {}),
              ...(item.sameAs ? { sameAs: item.sameAs } : {}),
            };
          }

          return undefined;
        })
        .filter(Boolean)
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url,
    ...(description ? { description } : {}),
    ...(normalizedImage ? { image: normalizedImage } : {}),
    ...(jobTitle ? { jobTitle } : {}),
    ...(inLanguage ? { inLanguage } : {}),
    ...(givenName ? { givenName } : {}),
    ...(familyName ? { familyName } : {}),
    ...(honorificPrefix ? { honorificPrefix } : {}),
    ...(honorificSuffix ? { honorificSuffix } : {}),
    ...(alternateName ? { alternateName } : {}),
    ...(email ? { email } : {}),
    ...(telephone ? { telephone } : {}),
    ...(sameAs?.length ? { sameAs } : {}),
    ...(knowsAbout?.length ? { knowsAbout } : {}),
    ...(knowsLanguage?.length ? { knowsLanguage } : {}),
    ...(normalizedAlumniOf?.length ? { alumniOf: normalizedAlumniOf } : {}),
    worksFor: normalizedWorksFor,
  };
};
