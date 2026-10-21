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
 * When a service page has no translation, the closest related page. The chain
 * is followed (a fallback can itself fall back) until a page exists in the
 * post's language; the last resort is the immigration hub.
 */
const SAME_LANGUAGE_FALLBACK: Record<string, string> = {
  'affirmative-asylum-applications': 'asylum-and-humanitarian-protection',
  'asylum-and-humanitarian-protection': 'immigration-law',
  'bia-appeals-and-motions': 'immigration-litigation',
  'business-employment-immigration-solutions': 'immigration-law',
  'business-formation-structuring': 'business-corporate-law',
  'business-immigration': 'business-employment-immigration-solutions',
  'car-truck-and-motorcycle-accidents': 'personal-injury-law',
  'change-and-extension-of-status': 'citizenship-status-and-travel',
  'child-green-card': 'family-based-immigration',
  'citizenship-and-naturalization': 'citizenship-status-and-travel',
  'citizenship-status-and-travel': 'immigration-law',
  'commercial-litigation-dispute-resolution': 'business-corporate-law',
  conservatorship: 'legal-guardianship',
  'contract-drafting-review-negotiation': 'business-corporate-law',
  'contract-review-and-executive-counsel': 'contract-drafting-review-negotiation',
  'copyright-registration': 'ip-law',
  'corporate-governance-and-internal-policies': 'business-corporate-law',
  'dangerous-or-defective-products': 'personal-injury-law',
  'e-1-visa': 'e-2-visa',
  'e-2-visa': 'business-employment-immigration-solutions',
  'e-3-visa': 'h-1b-visa',
  'eb-1-green-card': 'talent-and-extraordinary-ability-visas',
  'eb-1a-green-card': 'eb-1-green-card',
  'eb-1b-green-card': 'eb-1-green-card',
  'eb-1c-green-card': 'eb-1-green-card',
  'eb-3-green-card': 'business-employment-immigration-solutions',
  'eb-5-green-card': 'e-2-visa',
  'estate-planning-asset-protection': 'estate-planning',
  'f-1-visa': 'citizenship-status-and-travel',
  'family-based-immigration': 'immigration-law',
  'family-reunification': 'family-based-immigration',
  'foia-requests': 'immigration-litigation',
  'general-counsel-services': 'business-corporate-law',
  'green-card-for-parents': 'family-based-immigration',
  'green-card-through-asylum': 'asylum-and-humanitarian-protection',
  'guidance-in-commercial-and-residential-real-estate-transactions': 'real-estate',
  'h-1b-visa': 'business-employment-immigration-solutions',
  'h-1b1-visa': 'h-1b-visa',
  'h-2a-visa': 'h-2b-visa',
  'h-2b-visa': 'business-employment-immigration-solutions',
  'h-3-visa': 'j-1-visa',
  'habeas-corpus': 'immigration-litigation',
  'i-visa': 'business-employment-immigration-solutions',
  'immigration-appeals-delays-and-federal-court': 'immigration-litigation',
  'immigration-detention-and-bond': 'removal-defense',
  'immigration-litigation': 'immigration-law',
  'immigration-mandamus': 'immigration-litigation',
  'investor-and-treaty-visas': 'e-2-visa',
  'ip-litigation-and-dispute-resolution': 'ip-law',
  'ip-portfolio-management': 'ip-law',
  'j-1-visa': 'citizenship-status-and-travel',
  'k-1-fiance-visa': 'family-based-immigration',
  'l-1a-visa': 'business-employment-immigration-solutions',
  'l-1b-visa': 'l-1a-visa',
  'legal-guardianship': 'estate-planning',
  'm-1-visa': 'f-1-visa',
  'marriage-based-green-card': 'family-based-immigration',
  'medical-negligence': 'personal-injury-law',
  'mergers-acquisitions-business-transactions': 'business-corporate-law',
  'o-1a-visa': 'talent-and-extraordinary-ability-visas',
  'o-1b-visa': 'o-1a-visa',
  'p-1-visa': 'o-1b-visa',
  'p-2-visa': 'p-1-visa',
  'p-3-visa': 'p-1-visa',
  'pedestrian-and-bicycle-accidents': 'car-truck-and-motorcycle-accidents',
  'property-acquisitions-leasing-development': 'real-estate',
  'r-1-visa': 'business-employment-immigration-solutions',
  'real-estate-contracts-and-negotiations': 'real-estate',
  'removal-defense': 'immigration-law',
  'risk-management-and-legal-compliance': 'business-corporate-law',
  'sibling-green-card': 'family-based-immigration',
  'special-immigrant-juvenile-status': 'asylum-and-humanitarian-protection',
  'strategic-legal-guidance-for-businesses': 'general-counsel-services',
  'talent-and-extraordinary-ability-visas': 'immigration-law',
  'tn-visa': 'h-1b-visa',
  'trade-secret-protection': 'ip-law',
  'trademark-and-intellectual-property-registration': 'ip-law',
  'trademark-enforcement-and-ttab-proceedings': 'trademark-law',
  'trademark-law': 'trademark-and-intellectual-property-registration',
  'trademark-office-action-responses': 'trademark-law',
  'trademark-renewal-and-international-registration': 'trademark-law',
  'trademark-search-and-clearance': 'trademark-law',
  'travel-and-reentry-permits': 'citizenship-status-and-travel',
  'u-visa-vawa-humanitarian-protection': 'asylum-and-humanitarian-protection',
  'wills-trusts-probate-administration': 'estate-planning',
  'wrongful-death': 'personal-injury-law',
};

/** The page itself, then each fallback in turn, then the immigration hub. */
const fallbackChain = (slug: string): string[] => {
  const chain: string[] = [];
  for (
    let current: string | undefined = slug;
    current && !chain.includes(current);
    current = SAME_LANGUAGE_FALLBACK[current]
  ) {
    chain.push(current);
  }
  if (!chain.includes(DEFAULT_SERVICE)) chain.push(DEFAULT_SERVICE);
  return chain;
};

/**
 * Page slugs whose practiceArea content file has a different id. The personal
 * injury hub is served at /practice-area/personal-injury-law but its content
 * lives in <language>/personal-injury.md.
 */
const CONTENT_ID_ALIAS: Record<string, string> = {
  'personal-injury-law': 'personal-injury',
};

/**
 * Resolve the practice-area page a post should point to, always in the post's
 * own language.
 *
 * RULE: never link a reader to another language's page. If the exact service
 * is not translated, fall back to a related service or the hub page in the
 * same language, or show nothing.
 */
export const resolveRelatedService = async (
  post: Pick<Post, 'service' | 'category'>,
  lang: string = DEFAULT_LANG
): Promise<RelatedServiceTarget | undefined> => {
  const folder = LANG_TO_FOLDER[lang];
  if (!folder) return undefined;

  const slug = pickServiceSlug(post);
  const candidates = fallbackChain(slug);

  for (const candidateSlug of candidates) {
    const entry = await getEntry('practiceArea', `${folder}/${CONTENT_ID_ALIAS[candidateSlug] ?? candidateSlug}`);
    if (!entry) continue;
    return {
      slug: candidateSlug,
      lang,
      href: getServicePath(candidateSlug, lang),
      title: entry.data.post?.title ?? entry.data.metadata?.title ?? candidateSlug,
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
