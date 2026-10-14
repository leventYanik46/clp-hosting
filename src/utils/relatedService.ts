import { getEntry } from 'astro:content';
import type { Post } from '~/types';
import { cleanSlug } from '~/utils/permalinks';
import languages from '~/config/language.json';
import config from '~/config/config.json';

/** Practice-area hub pages live at /practice-area/<slug>; everything else is a key service. */
const HUB_SLUGS = new Set([
  'business-corporate-law',
  'estate-planning',
  'general-counsel-services',
  'immigration-law',
  'ip-law',
  'personal-injury-law',
  'real-estate',
]);

const DEFAULT_SERVICE = 'immigration-law';

/**
 * Fallback mapping from a post's category (slugified) to the practice-area page
 * it supports. Posts can override this with an explicit `service:` field.
 */
const CATEGORY_TO_SERVICE: Record<string, string> = {
  // Immigration (English)
  'business-immigration-law': 'business-employment-immigration-solutions',
  'business-immigration': 'business-employment-immigration-solutions',
  'investment-visa': 'e-2-visa',
  'student-visa': 'f-1-visa',
  'work-and-travel': 'j-1-visa',
  'immigrant-visas': 'business-employment-immigration-solutions',
  visa: 'business-employment-immigration-solutions',
  'visa-application': 'business-employment-immigration-solutions',
  'visa-refused': 'immigration-litigation',
  'us-visa-denials-refusals-and-rejections': 'immigration-litigation',
  'writ-of-mandamus': 'immigration-mandamus',
  'immigration-mandamus-lawsuits': 'immigration-mandamus',
  'affirmative-asylum': 'affirmative-asylum-applications',
  'removal-asylum': 'affirmative-asylum-applications',
  'removal-proceedings': 'removal-defense',
  'i-130': 'family-based-immigration',
  'citizenship-and-military-service': 'citizenship-and-naturalization',
  'eu-citizenship': 'citizenship-and-naturalization',
  'ciudadania-de-la-ue': 'citizenship-and-naturalization',
  'cidadania-da-ue': 'citizenship-and-naturalization',
  // Immigration (Turkish, Spanish, Portuguese, French)
  'gocmenlik-hukuku': 'immigration-law',
  'amerika-vizesi': 'business-employment-immigration-solutions',
  'green-card-basvurusu': 'immigration-law',
  'vize-and-green-card': 'immigration-law',
  'amerikada-oturma-izni': 'immigration-law',
  'amerikada-egitim': 'f-1-visa',
  'form-kilavuzu': 'immigration-law',
  'abd-vize-reddi-reddetme-ve-iade': 'immigration-litigation',
  'gocmenlik-ve-mesleki-lisanslama': 'business-employment-immigration-solutions',
  inmigracion: 'immigration-law',
  imigracao: 'immigration-law',
  'inmigracion-y-licencias-profesionales': 'business-employment-immigration-solutions',
  'imigracao-e-licenciamento-profissional': 'business-employment-immigration-solutions',
  'immigration-et-licence-professionnelle': 'business-employment-immigration-solutions',
  'immigration-and-professional-licensing': 'business-employment-immigration-solutions',
  // Business, IP, estate, real estate
  'corporate-and-business-law': 'business-corporate-law',
  'business-law': 'business-corporate-law',
  'business-litigation': 'commercial-litigation-dispute-resolution',
  'legal-advice': 'general-counsel-services',
  'law-partner': 'general-counsel-services',
  'intellectual-property-law': 'trademark-and-intellectual-property-registration',
  'intellectual-property': 'trademark-and-intellectual-property-registration',
  'estate-planning': 'estate-planning',
  'valid-will': 'wills-trusts-probate-administration',
  'real-estate': 'real-estate',
  'real-estate-law': 'real-estate',
};

const LANG_TO_FOLDER: Record<string, string> = Object.fromEntries(
  languages.map((language) => [language.languageCode, language.contentDir])
);

const DEFAULT_LANG: string = config.settings.default_language;

export interface RelatedServiceTarget {
  slug: string;
  href: string;
  lang: string;
  title: string;
  description?: string;
}

export const getServicePath = (slug: string, lang: string = DEFAULT_LANG): string => {
  const prefix = lang && lang !== DEFAULT_LANG ? `/${lang}` : '';
  const base = HUB_SLUGS.has(slug) ? '/practice-area' : '/practice-area/key-services';
  return `${prefix}${base}/${slug}`;
};

export const getSchedulePath = (lang: string = DEFAULT_LANG): string =>
  lang && lang !== DEFAULT_LANG ? `/${lang}/schedule` : '/schedule';

export const pickServiceSlug = (post: Pick<Post, 'service' | 'category'>): string => {
  if (post.service && typeof post.service === 'string') return post.service.trim();
  const categorySlug = post.category?.slug ?? (post.category?.title ? cleanSlug(post.category.title) : '');
  return CATEGORY_TO_SERVICE[categorySlug] ?? DEFAULT_SERVICE;
};

/**
 * Resolve the practice-area page a post should point to, in the post's language
 * when that translation exists, otherwise in the default language.
 */
export const resolveRelatedService = async (
  post: Pick<Post, 'service' | 'category'>,
  lang: string = DEFAULT_LANG
): Promise<RelatedServiceTarget | undefined> => {
  const slug = pickServiceSlug(post);
  const candidates = Array.from(new Set([lang, DEFAULT_LANG]));

  for (const candidateLang of candidates) {
    const folder = LANG_TO_FOLDER[candidateLang];
    if (!folder) continue;
    const entry = await getEntry('practiceArea', `${folder}/${slug}`);
    if (!entry) continue;
    return {
      slug,
      lang: candidateLang,
      href: getServicePath(slug, candidateLang),
      title: entry.data.post?.title ?? entry.data.metadata?.title ?? slug,
      description: entry.data.metadata?.description ?? entry.data.seo?.description,
    };
  }

  return undefined;
};

export const RELATED_SERVICE_COPY: Record<string, { eyebrow: string; primary: string; secondary: string }> = {
  en: { eyebrow: 'How we can help', primary: 'Talk to an attorney', secondary: 'Schedule a consultation' },
  tr: { eyebrow: 'Size nasıl yardımcı olabiliriz', primary: 'Bir avukatla görüşün', secondary: 'Randevu alın' },
  es: { eyebrow: 'Cómo podemos ayudarle', primary: 'Hable con un abogado', secondary: 'Programe una consulta' },
  pt: { eyebrow: 'Como podemos ajudar', primary: 'Fale com um advogado', secondary: 'Agende uma consulta' },
  fr: { eyebrow: 'Comment nous pouvons vous aider', primary: 'Parler à un avocat', secondary: 'Prendre rendez-vous' },
};
