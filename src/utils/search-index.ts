import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

import config from '~/config/config.json';
import languages from '~/config/language.json';
import { findImage } from '~/utils/images';
import { cleanSlug, getPermalink, POST_PERMALINK_PATTERN, trimSlash } from '~/utils/permalinks';

export interface SearchItem {
  lang: string;
  group: string;
  slug: string;
  href?: string;
  frontmatter: {
    title: string;
    image?: string;
    description?: string;
    categories?: string[];
    tags?: string[];
  };
  content: string;
}

const defaultLanguage = config.settings.default_language;
const defaultLanguageInSubdir = config.settings.default_language_in_subdir;

const languageCodeByContentDir = new Map(languages.map(({ contentDir, languageCode }) => [contentDir, languageCode]));

const topLevelPracticeAreaRoutes = new Map<string, string>([
  ['business-corporate-law', '/practice-area/business-corporate-law'],
  ['estate-planning', '/practice-area/estate-planning'],
  ['general-counsel-services', '/practice-area/general-counsel-services'],
  ['immigration-law', '/practice-area/immigration-law'],
  ['ip-law', '/practice-area/ip-law'],
  ['personal-injury', '/practice-area/personal-injury-law'],
  ['real-estate', '/practice-area/real-estate'],
]);

const getCollectionLanguageFromId = (id: string): string => {
  const [contentDir] = id.split('/');
  return languageCodeByContentDir.get(contentDir) || defaultLanguage;
};

const getEntryLanguages = (rawLang: unknown): string[] => {
  if (Array.isArray(rawLang)) {
    return rawLang.filter((value): value is string => typeof value === 'string' && value.length > 0);
  }

  if (typeof rawLang === 'string' && rawLang.length > 0) {
    return [rawLang];
  }

  return [defaultLanguage];
};

const getLocalizedHref = (path: string, lang: string, type: 'page' | 'post' = 'page'): string => {
  const normalizedPath = trimSlash(path);
  const localizedPath =
    lang === defaultLanguage && !defaultLanguageInSubdir ? normalizedPath : [lang, normalizedPath].filter(Boolean).join('/');

  return getPermalink(localizedPath, type);
};

const resolveImagePath = async (
  image: string | ImageMetadata | { src?: string } | null | undefined
): Promise<string | undefined> => {
  const imageSource =
    typeof image === 'string'
      ? image
      : image && typeof image === 'object' && 'src' in image && typeof image.src === 'string'
        ? image.src
        : undefined;

  if (!imageSource) return undefined;

  const resolvedImage = (await findImage(imageSource)) as string | ImageMetadata | null | undefined;
  if (!resolvedImage) return undefined;
  if (typeof resolvedImage === 'string') return resolvedImage;
  return typeof resolvedImage.src === 'string' ? resolvedImage.src : undefined;
};

const buildPostPermalink = ({
  id,
  slug,
  publishDate,
  category,
}: {
  id: string;
  slug: string;
  publishDate: Date;
  category?: string;
}): string => {
  const year = String(publishDate.getFullYear()).padStart(4, '0');
  const month = String(publishDate.getMonth() + 1).padStart(2, '0');
  const day = String(publishDate.getDate()).padStart(2, '0');
  const hour = String(publishDate.getHours()).padStart(2, '0');
  const minute = String(publishDate.getMinutes()).padStart(2, '0');
  const second = String(publishDate.getSeconds()).padStart(2, '0');

  return (
    '/' +
    POST_PERMALINK_PATTERN.replace('%slug%', slug)
      .replace('%id%', id)
      .replace('%category%', category || '')
      .replace('%year%', year)
      .replace('%month%', month)
      .replace('%day%', day)
      .replace('%hour%', hour)
      .replace('%minute%', minute)
      .replace('%second%', second)
      .split('/')
      .map((segment) => trimSlash(segment))
      .filter(Boolean)
      .join('/')
  );
};

const getPostSearchItems = async (): Promise<SearchItem[]> => {
  const posts = await getCollection('post');
  const publishedPosts = posts
    .filter((post) => !post.data.draft)
    .sort((a, b) => new Date(b.data.publishDate ?? 0).valueOf() - new Date(a.data.publishDate ?? 0).valueOf());

  const searchItems = await Promise.all(
    publishedPosts.map(async (post) => {
      const { id, slug: rawSlug = '', data, body = '' } = post as CollectionEntry<'post'> & { body?: string };
      const slug = cleanSlug(rawSlug || id.split('/').pop() || id);
      const publishDate = new Date(data.publishDate ?? new Date());
      const categoryTitle = typeof data.category === 'string' ? data.category : undefined;
      const categorySlug = categoryTitle ? cleanSlug(categoryTitle) : undefined;
      const permalink = buildPostPermalink({
        id,
        slug,
        publishDate,
        category: categorySlug,
      });
      const image = await resolveImagePath(data.image);
      const description = data.metadata?.description?.trim() || data.excerpt?.trim() || undefined;
      const tags = Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : undefined;

      return getEntryLanguages(data.lang).map((lang) => {
        return {
          lang,
          group: 'blog',
          slug: permalink,
          href: getLocalizedHref(permalink, lang, 'post'),
          frontmatter: {
            title: data.title,
            image,
            description,
            categories: categoryTitle ? [categoryTitle] : undefined,
            tags,
          },
          content: body,
        } satisfies SearchItem;
      });
    })
  );

  return searchItems.flat();
};

const getEventSearchItems = async (): Promise<SearchItem[]> => {
  const events = await getCollection('event');
  const publishedEvents = events
    .filter((event) => !event.data.draft)
    .sort((a, b) => new Date(b.data.publishDate ?? 0).valueOf() - new Date(a.data.publishDate ?? 0).valueOf());

  const searchItems = await Promise.all(
    publishedEvents.map(async (event) => {
      const { id, slug: rawSlug = '', data, body = '' } = event as CollectionEntry<'event'> & { body?: string };
      const slug = cleanSlug((rawSlug || id).split('/').pop() || rawSlug || id);
      const categoryTitle = typeof data.category === 'string' ? data.category : undefined;
      const image = await resolveImagePath(data.image);
      const description = data.metadata?.description?.trim() || data.excerpt?.trim() || undefined;
      const tags = Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : undefined;
      const eventPath = `/events/${slug}`;

      return getEntryLanguages(data.lang).map((lang) => {
        return {
          lang,
          group: 'events',
          slug: eventPath,
          href: getLocalizedHref(eventPath, lang),
          frontmatter: {
            title: data.title,
            image,
            description,
            categories: categoryTitle ? [categoryTitle] : undefined,
            tags,
          },
          content: body,
        } satisfies SearchItem;
      });
    })
  );

  return searchItems.flat();
};

const buildPracticeAreaRoute = (slug: string): string => {
  return topLevelPracticeAreaRoutes.get(slug) || `/practice-area/key-services/${slug}`;
};

const getPracticeAreaSearchItems = async (): Promise<SearchItem[]> => {
  const practiceAreas = await getCollection('practiceArea');

  const searchItems = await Promise.all(
    practiceAreas.map(async (entry) => {
      const slug = cleanSlug(entry.id.split('/').pop() || entry.id);
      const description = entry.data.metadata?.description?.trim() || entry.data.seo?.description?.trim() || undefined;

      return {
        lang: getCollectionLanguageFromId(entry.id),
        group: 'practice-area',
        slug: buildPracticeAreaRoute(slug),
        href: getLocalizedHref(buildPracticeAreaRoute(slug), getCollectionLanguageFromId(entry.id)),
        frontmatter: {
          title: entry.data.post.title,
          image: await resolveImagePath(entry.data.post.image),
          description,
        },
        content: typeof entry.data.post.content === 'string' ? entry.data.post.content : '',
      } satisfies SearchItem;
    })
  );

  return searchItems.sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title));
};

const getTeamMemberSearchItems = async (): Promise<SearchItem[]> => {
  const teamMembers = await getCollection('teamMember');

  const searchItems = await Promise.all(
    teamMembers.map(async (entry) => {
      const slug = cleanSlug(entry.id.split('/').pop() || entry.id);
      const bio = Array.isArray(entry.data.profile.bio) ? entry.data.profile.bio.join('\n\n') : '';
      const steps = Array.isArray(entry.data.steps)
        ? entry.data.steps
            .map((section) => {
              const itemText = section.items
                .map((item) => [item.title, item.description].filter(Boolean).join('\n'))
                .join('\n');
              return [section.title, itemText].filter(Boolean).join('\n');
            })
            .join('\n\n')
        : '';
      const testimonials = entry.data.testimonials?.items?.length
        ? entry.data.testimonials.items
            .map((item) => [item.title, item.testimonial, item.name, item.job].filter(Boolean).join('\n'))
            .join('\n\n')
        : '';
      const callToAction = [entry.data.cta?.title, entry.data.cta?.subtitle].filter(Boolean).join('\n');
      const blogPromo = [entry.data.blog?.title, entry.data.blog?.information].filter(Boolean).join('\n');

      return {
        lang: getCollectionLanguageFromId(entry.id),
        group: 'team',
        slug: `/our-team/${slug}`,
        href: getLocalizedHref(`/our-team/${slug}`, getCollectionLanguageFromId(entry.id)),
        frontmatter: {
          title: entry.data.profile.name,
          image: await resolveImagePath(entry.data.profile.image),
          description:
            entry.data.metadata?.description?.trim() || entry.data.seo?.description?.trim() || entry.data.profile.role,
          categories: entry.data.profile.role ? [entry.data.profile.role] : undefined,
        },
        content: [bio, steps, testimonials, callToAction, blogPromo].filter(Boolean).join('\n\n'),
      } satisfies SearchItem;
    })
  );

  return searchItems.sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title));
};

export const getGlobalSearchIndex = async (): Promise<SearchItem[]> => {
  const [posts, events, practiceAreas, teamMembers] = await Promise.all([
    getPostSearchItems(),
    getEventSearchItems(),
    getPracticeAreaSearchItems(),
    getTeamMemberSearchItems(),
  ]);

  return [...posts, ...events, ...practiceAreas, ...teamMembers];
};
