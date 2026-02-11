export interface PersonSchemaInput {
  name: string;
  description?: string;
  url: string;
  image?: string;
  jobTitle?: string;
  inLanguage?: string;
  siteUrl: string;
}

export const getPersonSchema = ({
  name,
  description,
  url,
  image,
  jobTitle,
  inLanguage,
  siteUrl,
}: PersonSchemaInput) => {
  const origin = new URL(siteUrl).origin;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(jobTitle ? { jobTitle } : {}),
    ...(inLanguage ? { inLanguage } : {}),
    worksFor: {
      '@id': `${origin}/#organization`,
    },
  };
};
