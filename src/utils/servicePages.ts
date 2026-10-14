import { getCollection, type CollectionEntry } from 'astro:content';
import config from '~/config/config.json';
import languages from '~/config/language.json';

const FOLDER_TO_LANG: Record<string, string> = Object.fromEntries(
  languages.map((language) => [language.contentDir, language.languageCode])
);

const { default_language, default_language_in_subdir } = config.settings;
const disabledLanguages = config.settings.disable_languages as string[];

export interface ServicePageProps {
  entry: CollectionEntry<'practiceArea'>;
  lang: string;
  /** Languages that have content for this service; drives hreflang. */
  availableLangs: string[];
}

/**
 * Static paths for one practice-area service page: one route per language
 * that actually has a content file, so a missing translation never breaks
 * the build and hreflang only lists pages that exist.
 */
export const getServiceStaticPaths = async (slug: string) => {
  const entries = await getCollection('practiceArea', ({ id, data }) => {
    const fileSlug = id.split('/').pop();
    return fileSlug === slug && !(data as { draft?: boolean }).draft;
  });

  const resolved = entries
    .map((entry) => ({ entry, lang: FOLDER_TO_LANG[entry.id.split('/')[0]] }))
    .filter(({ lang }) => Boolean(lang) && !disabledLanguages.includes(lang));

  const availableLangs = resolved.map(({ lang }) => lang);

  return resolved.map(({ entry, lang }) => ({
    params: { lang: lang === default_language && !default_language_in_subdir ? undefined : lang },
    props: { entry, lang, availableLangs } satisfies ServicePageProps,
  }));
};
