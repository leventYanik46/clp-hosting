const noteCollection = defineCollection({
  loader: glob({ pattern: '**/index.{md,mdx}', base: 'src/content/note' }),
  schema: z.object({
    title: z.string(),
    text: z.string(),
  }),
});
import { glob } from 'astro/loaders';
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

const imageSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  href: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  class: z.string().optional(),
  loading: z.string().optional(),
});

const actionSchema = z.object({
  variant: z.string().optional(),
  text: z.string(),
  href: z.string().optional(),
  target: z.string().optional(),
  rel: z.string().optional(),
  class: z.string().optional(),
});

const featureItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  link: z.string().optional(),
});

const featureSectionSchema = z.object({
  id: z.string().optional(),
  tagline: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  items: z.array(featureItemSchema),
});

const stepItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
});

const stepsSectionSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  items: z.array(stepItemSchema),
  classes: z.record(z.string()).optional(),
  image: imageSchema.optional(),
});

const testimonialItemSchema = z.object({
  title: z.string().optional(),
  testimonial: z.string(),
  name: z.string().optional(),
  job: z.string().optional(),
  image: imageSchema.optional(),
});

const testimonialsSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  callToAction: actionSchema.optional(),
  items: z.array(testimonialItemSchema),
});

const blogPromoSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  information: z.string().optional(),
  bgClass: z.string().optional(),
});

const callToActionSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  titleHtml: z.string().optional(),
  subtitle: z.string().optional(),
  subtitleHtml: z.string().optional(),
  tagline: z.string().optional(),
  actions: z.array(actionSchema).optional(),
  backgroundClass: z.string().optional(),
});

const locationSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  image: imageSchema,
});

const contactItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  link: z.string().optional(),
  icon: z.string().optional(),
});

const heroBasicSchema = z.object({
  tagline: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  subtitleHtml: z.string().optional(),
  description: z.string().optional(),
});

const heroWithHighlightSchema = z.object({
  title: z.object({
    highlight: z.string(),
    rest: z.string().optional(),
  }),
  subtitle: z.string().optional(),
  subtitleHtml: z.string().optional(),
  image: imageSchema.optional(),
  actions: z.array(actionSchema).optional(),
});

const spotlightSchema = z.object({
  props: z
    .object({
      isReversed: z.boolean().optional(),
      isAfterContent: z.boolean().optional(),
      tagline: z.string().optional(),
      title: z.string().optional(),
    })
    .passthrough()
    .optional(),
  items: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
  image: imageSchema.optional(),
  contentHtml: z.string().optional(),
  backgroundClass: z.string().optional(),
});

const contactFormSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  infoTitle: z.string().optional(),
  infoDescription: z.string().optional(),
  googleReview: z
    .object({
      label: z.string().optional(),
      rating: z.union([z.number(), z.string()]).optional(),
      count: z.union([z.number(), z.string()]).optional(),
      url: z.string().optional(),
    })
    .optional(),
  inputs: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
    })
    .optional(),
  textarea: z.string().optional(),
  disclaimer: z.string().optional(),
  description: z.string().optional(),
});

const contactSectionSchema = z.object({
  title: z.string().optional(),
  tagline: z.string().optional(),
  items: z.array(contactItemSchema),
});

const teamCardSchema = z.object({
  id: z.string().optional(),
  title: z.string().nullable().optional(),
  subtitle: z.string().optional(),
  tagline: z.string().optional(),
  bottomtag: z.string().optional(),
  description: z.string().optional(),
  actions: z.array(actionSchema).optional(),
  image: imageSchema.optional(),
});

const teamSectionSchema = z.object({
  wrapper: z.string().optional(),
  title: z.string().optional(),
  members: z.array(teamCardSchema),
});

const teamMemberProfileSchema = z.object({
  id: z.string().optional(),
  columns: z.number().optional(),
  image: imageSchema.optional(),
  name: z.string(),
  role: z.string().optional(),
  bio: z.array(z.string()).optional(),
  actions: z.array(actionSchema).optional(),
});

const teamMemberStepSectionSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  items: z.array(stepItemSchema),
  classes: z.record(z.string()).optional(),
});

const homepageCollection = defineCollection({
  loader: glob({ pattern: '**/-index.{md,mdx}', base: 'src/content/homepage' }),
  schema: z.object({
    metadata: metadataDefinition(),
    hero: heroWithHighlightSchema,
    practiceAreas: featureSectionSchema,
    spotlights: z.array(spotlightSchema).optional(),
    testimonials: testimonialsSchema.optional(),
    steps: stepsSectionSchema.optional(),
    blog: blogPromoSchema.optional(),
    cta: callToActionSchema.optional(),
  }),
});

const aboutCollection = defineCollection({
  loader: glob({ pattern: '**/-index.{md,mdx}', base: 'src/content/about' }),
  schema: z.object({
    metadata: metadataDefinition(),
    hero: heroBasicSchema.extend({
      title: z.string(),
    }),
    heroImage: imageSchema.optional(),
    practiceAreas: featureSectionSchema.optional(),
    values: featureSectionSchema.optional(),
    locations: z.array(locationSchema).optional(),
    contact: contactSectionSchema.optional(),
  }),
});

const contactCollection = defineCollection({
  loader: glob({ pattern: '**/-index.{md,mdx}', base: 'src/content/contact' }),
  schema: z.object({
    metadata: metadataDefinition(),
    hero: heroBasicSchema.extend({
      title: z.string(),
    }),
    contactForm: contactFormSchema,
    features: featureSectionSchema.extend({
      title: z.string(),
    }),
    locations: z
      .union([
        z.array(locationSchema),
        z.object({
          items: z.array(locationSchema),
        }),
      ])
      .optional(),
  }),
});

const locationsCollection = defineCollection({
  loader: glob({ pattern: '**/-index.{md,mdx}', base: 'src/content/locations' }),
  schema: z.object({
    metadata: metadataDefinition(),
    hero: heroBasicSchema.extend({
      title: z.string(),
    }),
    locations: z.array(locationSchema),
    callToAction: z
      .object({
        title: z.string(),
        subtitle: z.string().optional(),
        buttonText: z.string(),
        href: z.string().optional(),
      })
      .optional(),
    features: featureSectionSchema.extend({
      title: z.string(),
    }),
  }),
});

const scheduleCollection = defineCollection({
  loader: glob({ pattern: '**/-index.{md,mdx}', base: 'src/content/schedule' }),
  schema: z.object({
    metadata: metadataDefinition(),
    attorneys: z.array(teamCardSchema.extend({
      actions: z.array(actionSchema),
    })),
  }),
});

const evaluationsCollection = defineCollection({
  loader: glob({ pattern: '**/-index.{md,mdx}', base: 'src/content/evaluations' }),
  schema: z.object({
    metadata: metadataDefinition(),
    features: featureSectionSchema,
  }),
});

const teamCollection = defineCollection({
  loader: glob({ pattern: '**/-index.{md,mdx}', base: 'src/content/team' }),
  schema: z.object({
    metadata: metadataDefinition(),
    sections: z.array(teamSectionSchema),
  }),
});

const teamMemberCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: 'src/content/teamMember' }),
  schema: z.object({
    metadata: metadataDefinition(),
    profile: teamMemberProfileSchema,
    steps: z.array(teamMemberStepSectionSchema).optional(),
    testimonials: testimonialsSchema.optional(),
    cta: callToActionSchema.optional(),
    blog: blogPromoSchema.optional(),
  }),
});

const practiceAreaCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: 'src/content/practiceArea' }),
  schema: z.object({
    metadata: metadataDefinition(),
    hero: heroBasicSchema.extend({ image: imageSchema.optional() }).optional(),
    post: z.object({
      title: z.string(),
      image: z.union([z.string(), imageSchema]).optional(),
      content: z.string().optional(),
    }),
    contactForm: contactFormSchema.optional(), // <-- added
  }),
});

const notFoundCollection = defineCollection({
  loader: glob({ pattern: '**/-index.{md,mdx}', base: 'src/content/notFound' }),
  schema: z.object({
    metadata: metadataDefinition(),
    heading: z.object({
      label: z.string(),
      code: z.string(),
    }),
    messages: z.object({
      primary: z.string(),
      secondary: z.string().optional(),
    }),
    cta: z.object({
      text: z.string(),
      href: z.string().optional(),
    }),
  }),
});
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
    lang: z.enum(['en', 'tr']).optional().default('en'),
    metadata: metadataDefinition(),
  }),
});

const announcementCollection = defineCollection({
  loader: glob({ pattern: '**/-index.{md,mdx}', base: 'src/content/announcement' }),
  schema: z.object({
    title: z.string(),
    lang: z.string(),
    phone: z.string().optional(),
    phone_display: z.string().optional(),
    contact_url: z.string().optional(),
    contact_text: z.string().optional(),
    intro_text: z.string().optional(),
    call_text: z.string().optional(),
    or_text: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    linkedin: z.string().optional(),
  instagram_button_text: z.string().optional(),
  facebook_button_text: z.string().optional(),
  linkedin_button_text: z.string().optional(),
  }),
});

const confirmationCollection = defineCollection({
  schema: z.object({
    metadata: metadataDefinition(),
    title: z.string(),
    lang: z.enum(['en', 'tr', 'es', 'pt', 'fr']),
    info: z.string().optional(),
    phone: z.string().optional(),
    see_more_text: z.string().optional(),
    about_text: z.string().optional(),
    about_button_text: z.string().optional(),
    about_url: z.string().optional(),
    home_text: z.string().optional(),
    home_button_text: z.string().optional(),
    home_url: z.string().optional(),
    team_text: z.string().optional(),
    team_button_text: z.string().optional(),
    team_url: z.string().optional(),
    social_text: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    linkedin: z.string().optional(),
  }),
});

export const collections = {
  post: postCollection,
  homepage: homepageCollection,
  about: aboutCollection,
  contact: contactCollection,
  confirmation: confirmationCollection,
  locations: locationsCollection,
  schedule: scheduleCollection,
  evaluations: evaluationsCollection,
  team: teamCollection,
  teamMember: teamMemberCollection,
  practiceArea: practiceAreaCollection,
  notFound: notFoundCollection,
  announcement: announcementCollection,
  note: noteCollection,
};
