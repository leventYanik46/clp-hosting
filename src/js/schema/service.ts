export interface ServiceSchemaInput {
  name: string;
  description?: string;
  url: string;
  serviceType?: string;
  inLanguage?: string;
  siteUrl: string;
}

export const getServiceSchema = ({
  name,
  description,
  url,
  serviceType,
  inLanguage,
  siteUrl,
}: ServiceSchemaInput) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    url,
    ...(description ? { description } : {}),
    ...(serviceType ? { serviceType } : {}),
    ...(inLanguage ? { inLanguage } : {}),
    areaServed: ['US'],
  };
};
