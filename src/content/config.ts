import { z, defineCollection } from 'astro:content';

const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),

      canonical: z.string().url().optional(),

      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),

      description: z.string().optional(),

      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),

      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
    })
    .optional();

const postCollection = defineCollection({
  schema: z.object({
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),

    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),

    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    lang: z.union([z.enum(['en', 'tr', 'es', 'pt', 'fr']), z.array(z.enum(['en', 'tr', 'es', 'pt', 'fr']))]).default('en'),
    metadata: metadataDefinition(),
  }),
});

const confirmationCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['en', 'tr', 'es', 'pt', 'fr']),
    info: z.string().optional(),
    phone: z.string().optional(),
    see_more_text: z.string().optional(),
    about_text: z.string().optional(),
    about_url: z.string().optional(),
    home_text: z.string().optional(),
    home_url: z.string().optional(),
    team_text: z.string().optional(),
    team_url: z.string().optional(),
    social_text: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    linkedin: z.string().optional(),
    hero: z
      .object({
        subtitle: z.string().optional(),
        subtitleHtml: z.string().optional(),
      })
      .optional(),
    metadata: metadataDefinition(),
  }),
});

export const collections = {
  post: postCollection,
  confirmation: confirmationCollection,
};
