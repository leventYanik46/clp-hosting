import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Post } from '~/types';
import { cleanSlug } from './permalinks';
import config from '~/config/config.json';

const EVENTS_BASE = 'events';

const getNormalizedEvent = async (event: CollectionEntry<'event'>): Promise<Post> => {
  const { id, slug: rawSlug = '', data } = event;
  const { Content, remarkPluginFrontmatter } = await event.render();

  const {
    publishDate: rawPublishDate = new Date(),
    updateDate: rawUpdateDate,
    title,
    excerpt,
    image,
    tags: rawTags = [],
    category: rawCategory,
    author,
    draft = false,
    lang: rawLang = undefined,
    metadata = {},
  } = data;

  const slug = cleanSlug(rawSlug.split('/').pop() || rawSlug);
  const publishDate = new Date(rawPublishDate);
  const updateDate = rawUpdateDate ? new Date(rawUpdateDate) : undefined;

  const category = rawCategory
    ? {
        slug: cleanSlug(rawCategory),
        title: rawCategory,
      }
    : undefined;

  const tags = rawTags.map((tag: string) => ({
    slug: cleanSlug(tag),
    title: tag,
  }));

  return {
    id,
    slug,
    permalink: `${EVENTS_BASE}/${slug}`,
    publishDate,
    updateDate,
    title,
    excerpt,
    image,
    category,
    tags,
    author,
    draft,
    metadata,
    Content,
    readingTime: remarkPluginFrontmatter?.readingTime,
    lang: rawLang,
  };
};

const load = async function (): Promise<Array<Post>> {
  const events = await getCollection('event');
  const normalizedEvents = events.map(async (event) => await getNormalizedEvent(event));

  return (await Promise.all(normalizedEvents))
    .sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf())
    .filter((event) => !event.draft);
};

let _events: Array<Post>;

export const eventsListRobots = { index: true, follow: true };
export const eventPostRobots = { index: true, follow: true };

export const fetchEvents = async (): Promise<Array<Post>> => {
  if (!_events) {
    _events = await load();
  }

  return _events;
};

const defaultEventLanguage = config.settings.default_language;

export const getEventLanguageCodes = (event: Post): string[] => {
  const eventLang = event.lang;
  if (Array.isArray(eventLang) && eventLang.length > 0) return eventLang;
  if (typeof eventLang === 'string' && eventLang.length > 0) return [eventLang];
  return [defaultEventLanguage];
};

export const getEventsForLanguage = async (lang: string): Promise<Post[]> => {
  const events = await fetchEvents();

  return events.filter((event) => {
    const eventLang = event.lang;
    if (Array.isArray(eventLang)) return eventLang.includes(lang);
    if (typeof eventLang === 'string') return eventLang === lang;
    return lang === defaultEventLanguage;
  });
};

export const getStaticPathsEventPost = async () => {
  const events = await fetchEvents();
  const defaultLang = config.settings.default_language;
  const defaultLangInSubdir = config.settings.default_language_in_subdir;

  return events.flatMap((event) => {
    const langs = getEventLanguageCodes(event);

    return langs.map((code) => {
      const isDefaultWithoutSubdir = code === defaultLang && !defaultLangInSubdir;
      return {
        params: {
          lang: isDefaultWithoutSubdir ? undefined : code,
          slug: event.slug,
        },
        props: {
          event,
          lang: code,
        },
      };
    });
  });
};

export const getRelatedEvents = async (originalEvent: Post, maxResults: number = 4): Promise<Post[]> => {
  const allEvents = await fetchEvents();
  const originalTagsSet = new Set(originalEvent.tags ? originalEvent.tags.map((tag) => tag.slug) : []);

  const eventsWithScores = allEvents.reduce((acc: { event: Post; score: number }[], iteratedEvent: Post) => {
    if (iteratedEvent.slug === originalEvent.slug) return acc;

    let score = 0;

    if (
      iteratedEvent.category &&
      originalEvent.category &&
      iteratedEvent.category.slug === originalEvent.category.slug
    ) {
      score += 5;
    }

    if (iteratedEvent.tags) {
      iteratedEvent.tags.forEach((tag) => {
        if (originalTagsSet.has(tag.slug)) {
          score += 1;
        }
      });
    }

    acc.push({ event: iteratedEvent, score });
    return acc;
  }, []);

  eventsWithScores.sort((a, b) => b.score - a.score);

  const selectedEvents: Post[] = [];
  let i = 0;
  while (selectedEvents.length < maxResults && i < eventsWithScores.length) {
    selectedEvents.push(eventsWithScores[i].event);
    i++;
  }

  return selectedEvents;
};
