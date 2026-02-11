export interface BlogPostingSchemaInput {
  title: string;
  description?: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  articleSection?: string;
  keywords?: string[];
  inLanguage?: string;
  siteUrl: string;
}

export const getBlogPostingSchema = ({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
  articleSection,
  keywords,
  inLanguage,
  siteUrl,
}: BlogPostingSchemaInput) => {
  const origin = new URL(siteUrl).origin;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
    ...(image
      ? {
          image: {
            '@type': 'ImageObject',
            url: image,
          },
        }
      : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(inLanguage ? { inLanguage } : {}),
    ...(articleSection ? { articleSection } : {}),
    ...(keywords?.length ? { keywords: keywords.join(', ') } : {}),
    author: {
      '@type': 'Person',
      name: authorName || 'Capitol Law Partners',
    },
    publisher: {
      '@id': `${origin}/#organization`,
    },
  };
};
