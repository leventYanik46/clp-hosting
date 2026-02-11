export interface BreadcrumbItem {
  name: string;
  url: string;
}

export const getBreadcrumbSchema = (items: BreadcrumbItem[]) => {
  const itemListElement = items
    .filter((item) => item?.name && item?.url)
    .map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
};
