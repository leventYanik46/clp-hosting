import { getCollection } from 'astro:content';
import languages from '~/config/language.json';
import config from '~/config/config.json';
import { getServicePath } from '~/utils/relatedService';

/**
 * Practice-area mega menu: two audiences (individuals / businesses), each with
 * grouped columns of service links and a row of practice-area hub pages.
 *
 * Link labels: English uses the short labels below; other languages use the
 * localized page title from the practiceArea collection.
 *
 * RULE: a localized menu never links to another language's page. When a
 * service has no translation for the requested language, the item is left
 * out of that language's menu (and a group with no items disappears). Do not
 * reintroduce an English fallback here; translate the page instead.
 */

export type Audience = 'individuals' | 'businesses';

export interface MenuItem {
  slug: string;
  label: string;
  href: string;
}

export interface MenuGroup {
  key: string;
  title: string;
  links: MenuItem[];
}

export interface MenuTab {
  id: Audience;
  label: string;
  /** astro-icon name shown next to the tab label in the audience toggle. */
  icon: string;
  tagline: string;
  groups: MenuGroup[];
  hubs: MenuItem[];
}

export interface PracticeAreaMenu {
  lang: string;
  tabs: MenuTab[];
  hubsTitle: string;
  ctas: { label: string; href: string }[];
}

const EN_LABELS: Record<string, string> = {
  'family-based-immigration': 'Family Immigration Overview',
  'asylum-and-humanitarian-protection': 'Asylum & Humanitarian Overview',
  'talent-and-extraordinary-ability-visas': 'Talent Visas Overview',
  'citizenship-status-and-travel': 'Citizenship, Status & Travel Overview',
  'immigration-appeals-delays-and-federal-court': 'Appeals, Delays & Federal Court Overview',
  'business-immigration': 'Business Immigration Overview',
  'investor-and-treaty-visas': 'Investor & Treaty Visas Overview',
  'business-employment-immigration-solutions': 'PERM & Employer Sponsorship Overview',
  'trademark-law': 'Trademark Law Overview',
  'estate-planning': 'Trusts & Estates Overview',
  'personal-injury-law': 'Personal Injury Overview',
  'business-corporate-law': 'Business & Corporate Law Overview',
  'ip-law': 'Intellectual Property Overview',
  'real-estate': 'Real Estate Law Overview',
  'marriage-based-green-card': 'Marriage-Based Green Card',
  'green-card-for-parents': 'Green Card for Parents',
  'k-1-fiance-visa': 'K-1 Fiancé Visa',
  'child-green-card': 'Green Card for Children',
  'sibling-green-card': 'Sibling Green Card (F4)',
  'family-reunification': 'Family Reunification',
  'u-visa-vawa-humanitarian-protection': 'U Visa, VAWA & T Visa',
  'immigration-detention-and-bond': 'Detention, Bond & ICE Enforcement',
  'eb-1-green-card': 'EB-1 Green Cards (EB-1A, EB-1B, EB-1C)',
  'eb-1b-green-card': 'EB-1B Outstanding Researcher',
  'citizenship-and-naturalization': 'Citizenship & Naturalization',
  'change-and-extension-of-status': 'Change & Extension of Status',
  'travel-and-reentry-permits': 'Travel & Re-Entry Permits',
  'habeas-corpus': 'Habeas Corpus (Detention Lawsuits)',
  'bia-appeals-and-motions': 'BIA Appeals & Motions to Reopen',
  'foia-requests': 'FOIA Requests & Case File Access',
  'trademark-search-and-clearance': 'Trademark Search & Clearance',
  'trademark-office-action-responses': 'Office Action Responses',
  'trademark-enforcement-and-ttab-proceedings': 'Enforcement, Oppositions & TTAB',
  'trademark-renewal-and-international-registration': 'Renewal & Madrid Protocol',
  'ip-portfolio-management': 'IP Portfolio Management',
  'affirmative-asylum-applications': 'Asylum (Form I-589)',
  'green-card-through-asylum': 'Green Card Through Asylum',
  'special-immigrant-juvenile-status': 'Special Immigrant Juvenile Status (SIJS)',
  'removal-defense': 'Removal & Deportation Defense',
  'eb-2-niw-green-card': 'EB-2 National Interest Waiver (NIW)',
  'eb-1a-green-card': 'EB-1A Extraordinary Ability',
  'o-1a-visa': 'O-1A Visa',
  'o-1b-visa': 'O-1B Visa (Arts & Entertainment)',
  'f-1-visa': 'F-1 Student Visa',
  'j-1-visa': 'J-1 Exchange Visitor',
  'immigration-mandamus': 'Writ of Mandamus (Delayed Cases)',
  'immigration-litigation': 'Immigration Litigation',
  'wills-trusts-probate-administration': 'Wills, Trusts & Probate',
  'estate-planning-asset-protection': 'Estate Planning & Asset Protection',
  'legal-guardianship': 'Legal Guardianship',
  'personal-injury-law': 'Personal Injury',
  'wrongful-death': 'Wrongful Death',
  'h-1b-visa': 'H-1B Specialty Occupation',
  'l-1a-visa': 'L-1A Executives & Managers',
  'l-1b-visa': 'L-1B Specialized Knowledge',
  'tn-visa': 'TN (USMCA Professionals)',
  'e-3-visa': 'E-3 (Australian Professionals)',
  'h-1b1-visa': 'H-1B1 (Chile & Singapore)',
  'e-2-visa': 'E-2 Treaty Investor',
  'e-1-visa': 'E-1 Treaty Trader',
  'eb-5-green-card': 'EB-5 Investor Green Card',
  'eb-1c-green-card': 'EB-1C Multinational Manager',
  'business-employment-immigration-solutions': 'PERM & Employer Sponsorship',
  'eb-3-green-card': 'EB-3 Skilled Workers',
  'h-2a-visa': 'H-2A Agricultural Workers',
  'h-2b-visa': 'H-2B Seasonal Workers',
  'r-1-visa': 'R-1 Religious Workers',
  'p-1-visa': 'P-1 Athletes & Entertainers',
  'business-formation-structuring': 'Business Formation & Structuring',
  'contract-drafting-review-negotiation': 'Contracts & Negotiation',
  'mergers-acquisitions-business-transactions': 'Mergers & Acquisitions',
  'corporate-governance-and-internal-policies': 'Corporate Governance',
  'risk-management-and-legal-compliance': 'Risk & Compliance',
  'commercial-litigation-dispute-resolution': 'Commercial Litigation',
  'trademark-and-intellectual-property-registration': 'Trademark Registration',
  'copyright-registration': 'Copyright Registration',
  'trade-secret-protection': 'Trade Secret Protection',
  'ip-litigation-and-dispute-resolution': 'IP Litigation',
  'property-acquisitions-leasing-development': 'Property Acquisition & Leasing',
  'real-estate-contracts-and-negotiations': 'Real Estate Contracts',
};

const ICONS: Record<Audience, string> = {
  individuals: 'tabler:user',
  businesses: 'tabler:building',
};

const STRUCTURE: Record<Audience, { groups: { key: string; slugs: string[] }[]; hubs: string[] }> = {
  individuals: {
    groups: [
      {
        key: 'family',
        slugs: [
          'family-based-immigration',
          'marriage-based-green-card',
          'green-card-for-parents',
          'child-green-card',
          'sibling-green-card',
          'k-1-fiance-visa',
          'family-reunification',
        ],
      },
      {
        key: 'asylum',
        slugs: [
          'asylum-and-humanitarian-protection',
          'affirmative-asylum-applications',
          'green-card-through-asylum',
          'special-immigrant-juvenile-status',
          'u-visa-vawa-humanitarian-protection',
          'immigration-detention-and-bond',
          'removal-defense',
        ],
      },
      {
        key: 'talent',
        slugs: [
          'talent-and-extraordinary-ability-visas',
          'eb-1-green-card',
          'eb-1a-green-card',
          'eb-1b-green-card',
          'eb-2-niw-green-card',
          'o-1a-visa',
          'o-1b-visa',
        ],
      },
      {
        key: 'status',
        slugs: [
          'citizenship-status-and-travel',
          'citizenship-and-naturalization',
          'change-and-extension-of-status',
          'travel-and-reentry-permits',
          'f-1-visa',
          'j-1-visa',
        ],
      },
      {
        key: 'court',
        slugs: [
          'immigration-appeals-delays-and-federal-court',
          'immigration-mandamus',
          'habeas-corpus',
          'bia-appeals-and-motions',
          'immigration-litigation',
          'foia-requests',
        ],
      },
      {
        key: 'personal',
        slugs: [
          'estate-planning',
          'personal-injury-law',
          'wills-trusts-probate-administration',
          'estate-planning-asset-protection',
          'legal-guardianship',
          'wrongful-death',
        ],
      },
    ],
    hubs: ['immigration-law', 'estate-planning', 'personal-injury-law', 'real-estate'],
  },
  businesses: {
    groups: [
      {
        key: 'work',
        slugs: ['business-immigration', 'h-1b-visa', 'l-1a-visa', 'l-1b-visa', 'tn-visa', 'e-3-visa', 'h-1b1-visa'],
      },
      {
        key: 'investors',
        slugs: ['investor-and-treaty-visas', 'e-2-visa', 'e-1-visa', 'eb-5-green-card', 'eb-1c-green-card'],
      },
      {
        key: 'workers',
        slugs: [
          'business-employment-immigration-solutions',
          'eb-3-green-card',
          'h-2a-visa',
          'h-2b-visa',
          'r-1-visa',
          'p-1-visa',
        ],
      },
      {
        key: 'corporate',
        slugs: [
          'business-corporate-law',
          'business-formation-structuring',
          'contract-drafting-review-negotiation',
          'mergers-acquisitions-business-transactions',
          'corporate-governance-and-internal-policies',
          'risk-management-and-legal-compliance',
          'commercial-litigation-dispute-resolution',
        ],
      },
      {
        key: 'trademarks',
        slugs: [
          'trademark-law',
          'trademark-and-intellectual-property-registration',
          'trademark-search-and-clearance',
          'trademark-office-action-responses',
          'trademark-enforcement-and-ttab-proceedings',
          'trademark-renewal-and-international-registration',
        ],
      },
      {
        key: 'ip',
        slugs: [
          'ip-law',
          'real-estate',
          'copyright-registration',
          'trade-secret-protection',
          'ip-litigation-and-dispute-resolution',
          'property-acquisitions-leasing-development',
          'real-estate-contracts-and-negotiations',
        ],
      },
    ],
    hubs: ['immigration-law', 'business-corporate-law', 'general-counsel-services', 'ip-law', 'real-estate'],
  },
};

interface Copy {
  tabs: Record<Audience, string>;
  taglines: Record<Audience, string>;
  groups: Record<string, string>;
  hubsTitle: string;
  ctas: { label: string; path: string }[];
}

const COPY: Record<string, Copy> = {
  en: {
    tabs: { individuals: 'For Individuals', businesses: 'For Businesses' },
    taglines: {
      individuals: 'Green cards, asylum, family petitions and personal legal matters.',
      businesses: 'Work visas, investor immigration, corporate, IP and real estate counsel.',
    },
    groups: {
      family: 'Family-Based Green Cards',
      asylum: 'Asylum & Humanitarian Relief',
      talent: 'Talent & Extraordinary Ability',
      status: 'Citizenship, Status & Travel',
      court: 'Delays, Appeals & Federal Court',
      personal: 'Estate & Personal Injury',
      work: 'Work Visas for Employees',
      investors: 'Investors & Treaty Traders',
      workers: 'Sponsored Green Cards & Other Workers',
      corporate: 'Business & Corporate',
      trademarks: 'Trademarks',
      ip: 'Copyright, IP & Real Estate',
    },
    hubsTitle: 'Practice area overviews',
    ctas: [
      { label: 'Free Case Evaluation', path: '/evaluations' },
      { label: 'Schedule a Consultation', path: '/schedule' },
    ],
  },
  tr: {
    tabs: { individuals: 'Bireyler İçin', businesses: 'Şirketler İçin' },
    taglines: {
      individuals: 'Green card, iltica, aile dilekçeleri ve kişisel hukuki konular.',
      businesses: 'Çalışma vizeleri, yatırımcı göçmenliği, şirketler hukuku, fikri mülkiyet ve gayrimenkul.',
    },
    groups: {
      family: 'Aile Bazlı Green Card',
      asylum: 'İltica ve İnsani Koruma',
      talent: 'Yetenek ve Olağanüstü Yetenek',
      status: 'Vatandaşlık, Statü ve Seyahat',
      court: 'Gecikmeler, Temyiz ve Federal Mahkeme',
      personal: 'Miras ve Kişisel Yaralanma',
      work: 'Çalışan Vizeleri',
      investors: 'Yatırımcılar ve Anlaşma Tacirleri',
      workers: 'Sponsorlu Green Card ve Diğer Çalışanlar',
      corporate: 'İş ve Şirketler Hukuku',
      trademarks: 'Markalar',
      ip: 'Telif, Fikri Mülkiyet ve Gayrimenkul',
    },
    hubsTitle: 'Çalışma alanı genel bakışları',
    ctas: [
      { label: 'Ücretsiz Değerlendirme', path: '/evaluations' },
      { label: 'Randevu Alın', path: '/schedule' },
    ],
  },
  es: {
    tabs: { individuals: 'Para Particulares', businesses: 'Para Empresas' },
    taglines: {
      individuals: 'Green cards, asilo, peticiones familiares y asuntos legales personales.',
      businesses:
        'Visas de trabajo, inmigración de inversionistas, derecho corporativo, propiedad intelectual e inmobiliario.',
    },
    groups: {
      family: 'Green Card por Familia',
      asylum: 'Asilo y Protección Humanitaria',
      talent: 'Talento y Habilidad Extraordinaria',
      status: 'Ciudadanía, Estatus y Viajes',
      court: 'Demoras, Apelaciones y Corte Federal',
      personal: 'Sucesiones y Lesiones Personales',
      work: 'Visas de Trabajo',
      investors: 'Inversionistas y Comerciantes por Tratado',
      workers: 'Green Cards Patrocinadas y Otros Trabajadores',
      corporate: 'Derecho Corporativo',
      trademarks: 'Marcas Registradas',
      ip: 'Derechos de Autor, PI e Inmobiliario',
    },
    hubsTitle: 'Áreas de práctica',
    ctas: [
      { label: 'Evaluación Gratuita', path: '/evaluations' },
      { label: 'Programe una Consulta', path: '/schedule' },
    ],
  },
  pt: {
    tabs: { individuals: 'Para Pessoas', businesses: 'Para Empresas' },
    taglines: {
      individuals: 'Green cards, asilo, petições familiares e assuntos jurídicos pessoais.',
      businesses:
        'Vistos de trabalho, imigração de investidores, direito empresarial, propriedade intelectual e imobiliário.',
    },
    groups: {
      family: 'Green Card por Família',
      asylum: 'Asilo e Proteção Humanitária',
      talent: 'Talento e Habilidade Extraordinária',
      status: 'Cidadania, Status e Viagens',
      court: 'Atrasos, Recursos e Tribunal Federal',
      personal: 'Sucessões e Danos Pessoais',
      work: 'Vistos de Trabalho',
      investors: 'Investidores e Comerciantes por Tratado',
      workers: 'Green Cards Patrocinados e Outros Trabalhadores',
      corporate: 'Direito Empresarial',
      trademarks: 'Marcas Registradas',
      ip: 'Direitos Autorais, PI e Imobiliário',
    },
    hubsTitle: 'Áreas de atuação',
    ctas: [
      { label: 'Avaliação Gratuita', path: '/evaluations' },
      { label: 'Agende uma Consulta', path: '/schedule' },
    ],
  },
  fr: {
    tabs: { individuals: 'Pour les particuliers', businesses: 'Pour les entreprises' },
    taglines: {
      individuals: 'Cartes vertes, asile, demandes familiales et affaires juridiques personnelles.',
      businesses:
        'Visas de travail, immigration des investisseurs, droit des sociétés, propriété intellectuelle et immobilier.',
    },
    groups: {
      family: 'Cartes vertes familiales',
      asylum: 'Asile et protection humanitaire',
      talent: 'Talent et capacités extraordinaires',
      status: 'Citoyenneté, statut et voyages',
      court: 'Retards, appels et tribunal fédéral',
      personal: 'Successions et dommages corporels',
      work: 'Visas de travail',
      investors: 'Investisseurs et commerçants',
      workers: 'Cartes vertes parrainées et autres travailleurs',
      corporate: 'Droit des affaires',
      trademarks: 'Marques',
      ip: "Droits d'auteur, PI et immobilier",
    },
    hubsTitle: "Domaines d'activité",
    ctas: [
      { label: 'Évaluation gratuite', path: '/evaluations' },
      { label: 'Prendre rendez-vous', path: '/schedule' },
    ],
  },
};

const DEFAULT_LANG: string = config.settings.default_language;
const LANG_TO_FOLDER: Record<string, string> = Object.fromEntries(
  languages.map((language) => [language.languageCode, language.contentDir])
);

const withLang = (path: string, lang: string) => (lang && lang !== DEFAULT_LANG ? `/${lang}${path}` : path);

const cache = new Map<string, PracticeAreaMenu>();

export const getPracticeAreaMenu = async (rawLang?: string): Promise<PracticeAreaMenu> => {
  const lang = rawLang && COPY[rawLang] ? rawLang : DEFAULT_LANG;
  const cached = cache.get(lang);
  if (cached) return cached;

  const entries = await getCollection('practiceArea', ({ data }) => !(data as { draft?: boolean }).draft);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const folder = LANG_TO_FOLDER[lang];
  const copy = COPY[lang];

  const resolve = (slug: string): MenuItem | undefined => {
    // Same-language only: a missing translation hides the item, it never
    // falls back to the English page.
    const entry = folder ? byId.get(`${folder}/${slug}`) : undefined;
    if (!entry) return undefined;
    const label =
      lang === DEFAULT_LANG
        ? (EN_LABELS[slug] ?? entry.data.post?.title ?? slug)
        : (entry.data.post?.title ?? EN_LABELS[slug] ?? slug);
    return { slug, label, href: getServicePath(slug, lang) };
  };

  const tabs: MenuTab[] = (Object.keys(STRUCTURE) as Audience[]).map((id) => ({
    id,
    label: copy.tabs[id],
    icon: ICONS[id],
    tagline: copy.taglines[id],
    groups: STRUCTURE[id].groups
      .map((group) => ({
        key: group.key,
        title: copy.groups[group.key] ?? group.key,
        links: group.slugs.map(resolve).filter((item): item is MenuItem => Boolean(item)),
      }))
      .filter((group) => group.links.length > 0),
    hubs: STRUCTURE[id].hubs.map(resolve).filter((item): item is MenuItem => Boolean(item)),
  }));

  const menu: PracticeAreaMenu = {
    lang,
    tabs,
    hubsTitle: copy.hubsTitle,
    ctas: copy.ctas.map(({ label, path }) => ({ label, href: withLang(path, lang) })),
  };
  cache.set(lang, menu);
  return menu;
};
