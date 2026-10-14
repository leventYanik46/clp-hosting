import type { FaqItem } from '~/types';

/**
 * FAQPage structured data. Answers may contain simple HTML
 * (Google accepts p, ul, ol, li, a, strong, em, br inside Answer.text).
 */
export const getFaqPageSchema = (items: FaqItem[], pageUrl?: string) => {
  const mainEntity = items
    .filter((item) => item && item.question && item.answer)
    .map(({ question, answer }) => ({
      '@type': 'Question',
      name: question.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer.trim(),
      },
    }));

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(pageUrl ? { '@id': `${pageUrl}#faq` } : {}),
    mainEntity,
  };
};
