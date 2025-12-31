import { getPermalink, getBlogPermalink } from './utils/permalinks';


export const headerData = {
  links: [
    {
      text: 'About Us',
      href: getPermalink('/about'),
    },
    {
      text: 'Practice Areas',
      links: [
        {
          text: 'General Counsel & Advisory Services',
          href: getPermalink('/practice-area/general-counsel-services'),
        },
        {
          text: 'Business & Corporate Law',
          href: getPermalink('/practice-area/business-corporate-law'),
        },

        {
          text: 'Trusts & Estates',
          href: getPermalink('/practice-area/estate-planning'),
        },
        {
          text: 'Real Estate',
          href: getPermalink('/practice-area/real-estate'),
        },
        {
          text: 'Intellectual Property Law',
          href: getPermalink('/practice-area/ip-law'),
        },
        {
          text: 'Immigration Law',
          href: getPermalink('/practice-area/immigration-law'),
        },
        {
          text: 'Personal Injury Law',
          href: getPermalink('/practice-area/personal-injury-law'),
        },
      ],
    },
    {
      text: 'Our Team',
      links: [
        {
          text: 'Meet Our Team',
          href: getPermalink('/team'),
        },
        {
          text: 'Cagatay Ersoy',
          href: getPermalink('/our-team/cagatay'),
        },
        {
          text: 'Sena Sahin',
          href: getPermalink('/our-team/sena'),
        },
        { text: 'Shafeek Seddiq', 
          href: getPermalink('/our-team/shafeek'),
        },
        { text: 'S. Selman Kilic', 
          href: getPermalink('/our-team/selman'),
        },
        { text: 'Esra Nur Bulan', 
          href: getPermalink('/our-team/esra'),
        },
        { text: 'Mehmet Y. Turkoglu', 
          href: getPermalink('/our-team/mehmet'),
        },
        { text: 'Kemal Sahin', 
          href: getPermalink('/our-team/kemal'),
        },
        { text: 'Omar Bississo',
          href: getPermalink('/our-team/omar'),
        },
      ],
    },
    {
      text: 'Our Locations',
      href: getPermalink('/locations'),
    },
    {
      text: 'Blog',
      href: getPermalink('/blog'),
    },
  ],
  actions: [{ text: 'Contact Us', href: '/contact', variant: 'primary' }],
};
export const headerDataTr = {
  links: [
    {
      text: 'Hakkımızda',
      href: getPermalink('/tr/about'),
    },
    {
      text: 'Çalışma Alanları',
      links: [
        {
          text: 'Genel Hukuk Müşavirliği ve Danışmanlık',
          href: getPermalink('/tr/practice-area/general-counsel-services'),
        },
        {
          text: 'İş ve Şirketler Hukuku',
          href: getPermalink('/tr/practice-area/business-corporate-law'),
        },
        {
          text: 'Vasiyet ve Miras Hukuku',
          href: getPermalink('/tr/practice-area/estate-planning'),
        },
        {
          text: 'Gayrimenkul Hukuku',
          href: getPermalink('/tr/practice-area/real-estate'),
        },
        {
          text: 'Fikri Mülkiyet Hukuku',
          href: getPermalink('/tr/practice-area/ip-law'),
        },
        {
          text: 'Göçmenlik Hukuku',
          href: getPermalink('/tr/practice-area/immigration-law'),
        },
        {
          text: 'Kişisel Yaralanma Hukuku',
          href: getPermalink('/tr/practice-area/personal-injury-law'),
        },
      ],
    },
    {
      text: 'Ekibimiz',
      links: [
        {
          text: 'Ekibimizle Tanışın',
          href: getPermalink('/tr/team'),
        },
        {
          text: 'Çağatay Ersoy',
          href: getPermalink('/tr/our-team/cagatay'),
        },
        {
          text: 'Sena Şahin',
          href: getPermalink('/tr/our-team/sena'),
        },
        { 
          text: 'Shafeek Seddiq', 
          href: getPermalink('/tr/our-team/shafeek'),
        },
        { 
          text: 'S. Selman Kılıç', 
          href: getPermalink('/tr/our-team/selman'),
        },
        { 
          text: 'Esra Nur Bulan', 
          href: getPermalink('/tr/our-team/esra'),
        },
        { 
          text: 'Mehmet Y. Turkoglu', 
          href: getPermalink('/tr/our-team/mehmet'),
        },
        { 
          text: 'Kemal Şahin', 
          href: getPermalink('/tr/our-team/kemal'),
        },
        {
          text: 'Omar Bississo',
          href: getPermalink('/tr/our-team/omar'),
        },
      ],
    },
    {
      text: 'Ofislerimiz',
      href: getPermalink('/tr/locations'),
    },
    {
      text: 'Blog',
      href: getPermalink('/tr/blog'),
    },
  ],
  actions: [
    { text: 'Bize Ulaşın', href: '/tr/contact', variant: 'primary' },
  ],
};

export const headerDataEs= {
  links: [
    {
      text: 'Sobre Nosotros',
      links: [
        {
          text: 'Sobre Nosotros',
          href: getPermalink('/es/about'),
        },
        {
          text: 'Nuestras Ubicaciones',
          href: getPermalink('/es/locations'),
        },
        {
          text: 'Blog',
          href: getPermalink('/es/blog'),
        },
      ],
    },
    {
      text: 'Áreas de Práctica',
      links: [
        {
          text: 'Asesoría General y Servicios Consultivos',
          href: getPermalink('/es/practice-area/general-counsel-services'),
        },
        {
          text: 'Derecho Empresarial y Corporativo',
          href: getPermalink('/es/practice-area/business-corporate-law'),
        },
        {
          text: 'Fideicomisos y Sucesiones',
          href: getPermalink('/es/practice-area/estate-planning'),
        },
        {
          text: 'Derecho Inmobiliario',
          href: getPermalink('/es/practice-area/real-estate'),
        },
        {
          text: 'Propiedad Intelectual',
          href: getPermalink('/es/practice-area/ip-law'),
        },
        {
          text: 'Derecho Migratorio',
          href: getPermalink('/es/practice-area/immigration-law'),
        },
        {
          text: 'Lesiones Personales',
          href: getPermalink('/es/practice-area/personal-injury-law'),
        },
      ],
    },
    {
      text: 'Nuestro Equipo',
      links: [
        {
          text: 'Conozca a Nuestro Equipo',
          href: getPermalink('/es/team'),
        },
        {
          text: 'Cagatay Ersoy',
          href: getPermalink('/es/our-team/cagatay'),
        },
        {
          text: 'Sena Sahin',
          href: getPermalink('/es/our-team/sena'),
        },
        {
          text: 'Shafeek Seddiq',
          href: getPermalink('/es/our-team/shafeek'),
        },
        {
          text: 'S. Selman Kilic',
          href: getPermalink('/es/our-team/selman'),
        },
        {
          text: 'Esra Nur Bulan',
          href: getPermalink('/es/our-team/esra'),
        },
        {
          text: 'Mehmet Y. Turkoglu',
          href: getPermalink('/es/our-team/mehmet'),
        },
        {
          text: 'Kemal Sahin',
          href: getPermalink('/es/our-team/kemal'),
        },
        {
          text: 'Omar Bississo',
          href: getPermalink('/es/our-team/omar'),
        },
      ],
    },
  ],
  actions: [
    { text: 'Contáctenos', href: '/es/contact', variant: 'primary' },
  ],
};
export const headerDataFr = {
  links: [
    {
      text: 'À propos',
      links: [
        {
          text: 'À propos de nous',
          href: getPermalink('/fr/about'),
        },
        {
          text: 'Nos bureaux',
          href: getPermalink('/fr/locations'),
        },
      ],
    },
    {
      text: 'Domaines de pratique',
      links: [
        {
          text: 'Conseil juridique externe et services',
          href: getPermalink('/fr/practice-area/general-counsel-services'),
        },
        {
          text: 'Droit des affaires et des sociétés',
          href: getPermalink('/fr/practice-area/business-corporate-law'),
        },
        {
          text: 'Trusts et successions',
          href: getPermalink('/fr/practice-area/estate-planning'),
        },
        {
          text: 'Droit immobilier',
          href: getPermalink('/fr/practice-area/real-estate'),
        },
        {
          text: 'Propriété intellectuelle',
          href: getPermalink('/fr/practice-area/ip-law'),
        },
        {
          text: 'Droit de l’immigration',
          href: getPermalink('/fr/practice-area/immigration-law'),
        },
        {
          text: 'Préjudice Corporel',
          href: getPermalink('/fr/practice-area/personal-injury-law'),
        },
      ],
    },
    {
      text: 'Notre équipe',
      links: [
        {
          text: 'Rencontrez notre équipe',
          href: getPermalink('/fr/team'),
        },
        {
          text: 'Cagatay Ersoy',
          href: getPermalink('/fr/our-team/cagatay'),
        },
        {
          text: 'Sena Sahin',
          href: getPermalink('/fr/our-team/sena'),
        },
        { text: 'Shafeek Seddiq',
          href: getPermalink('/fr/our-team/shafeek')
        },
        { text: 'S. Selman Kilic',
          href: getPermalink('/fr/our-team/selman') },
        { text: 'Esra Nur Bulan',
          href: getPermalink('/fr/our-team/esra') },
        { text: 'Mehmet Y. Turkoglu',
          href: getPermalink('/fr/our-team/mehmet') },
        { text: 'Kemal Sahin',
          href: getPermalink('/fr/our-team/kemal') },
        { text: 'Omar Bississo',
          href: getPermalink('/fr/our-team/omar') },
      ],
    },
    {
      text: 'Blog',
      href: getPermalink('/fr/blog'),
    },
  ],
  actions: [
    { text: 'Nous contacter', href: '/fr/contact', variant: 'primary' },
  ],
};
export const headerDataPt = {
  links: [
    {
      text: 'Sobre Nós',
      links: [
        {
          text: 'Sobre Nós',
          href: getPermalink('/pt/about'),
        },
        {
          text: 'Nossos Escritórios',
          href: getPermalink('/pt/locations'),
        },
      ],
    },
    {
      text: 'Áreas de Atuação',
      links: [
        {
          text: 'Consultoria Jurídica Externa e Serviços de Assessoria',
          href: getPermalink('/pt/practice-area/general-counsel-services'),
        },
        {
          text: 'Direito Empresarial e Societário',
          href: getPermalink('/pt/practice-area/business-corporate-law'),
        },

        {
          text: 'Trusts e Sucessões',
          href: getPermalink('/pt/practice-area/estate-planning'),
        },
        {
          text: 'Direito Imobiliário',
          href: getPermalink('/pt/practice-area/real-estate'),
        },
        {
          text: 'Propriedade Intelectual',
          href: getPermalink('/pt/practice-area/ip-law'),
        },
        {
          text: 'Direito de Imigração',
          href: getPermalink('/pt/practice-area/immigration-law'),
        },
        {
          text: 'Direito de Lesões Pessoais',
          href: getPermalink('/pt/practice-area/personal-injury-law'),
        },
      ],
    },
    {
      text: 'Nossa Equipe',
      links: [
        {
          text: 'Conheça Nossa Equipe',
          href: getPermalink('/pt/team'),
        },
        {
          text: 'Cagatay Ersoy',
          href: getPermalink('/pt/our-team/cagatay'),
        },
        {
          text: 'Sena Sahin',
          href: getPermalink('/pt/our-team/sena'),
        },
        { text: 'Shafeek Seddiq', 
          href: getPermalink('/pt/our-team/shafeek') 
        },
        { text: 'S. Selman Kilic', 
          href: getPermalink('/pt/our-team/selman') },
        { text: 'Esra Nur Bulan', 
          href: getPermalink('/pt/our-team/esra') },
        { text: 'Mehmet Y. Turkoglu', 
          href: getPermalink('/pt/our-team/mehmet') },
        { text: 'Kemal Sahin', 
          href: getPermalink('/pt/our-team/kemal') },
        { text: 'Omar Bississo',
          href: getPermalink('/pt/our-team/omar') },
      ],
    },
    {
      text: 'Blog',
      href: getPermalink('/pt/blog'),
    },
  ],
  actions: [
    { text: 'Fale Conosco', href: '/pt/contact', variant: 'primary' },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Information',
      links: [
        { text: 'About Us',  href: getPermalink('/about') },
        { text: 'Our Locations', href: getPermalink('/locations') },
        { text: 'Contact Us', href: getPermalink('/contact') },
      ],
    },
    {
      title: 'Our Team',
      links: [
        { text: 'Meet Our Team', href: getPermalink('/team')},
        { text: 'Cagatay Ersoy', href: getPermalink('/our-team/cagatay') },
        { text: 'Sena Sahin', href: getPermalink('/our-team/sena') },
        { text: 'Shafeek Seddiq', href: getPermalink('/our-team/shafeek') },
        { text: 'S. Selman Kilic', href: getPermalink('/our-team/selman') },
        { text: 'Esra Nur Bulan', href: getPermalink('/our-team/esra') },
        { text: 'Mehmet Y. Turkoglu', href: getPermalink('/our-team/mehmet') },
        { text: 'Kemal Sahin', href: getPermalink('/our-team/kemal') },
        { text: 'Omar Bississo', href: getPermalink('/our-team/omar') },

      ],
    },
    {
      title: 'Practice Areas',
      links: [
        { text: 'General Counsel Services', href: getPermalink('/practice-area/general-counsel-services') },
        { text: 'Business & Corporate Law', href: getPermalink('/practice-area/business-corporate-law') },
        { text: 'Trusts & Estates', href: getPermalink('/practice-area/estate-planning') },
        { text: 'Real Estate', href: getPermalink('/practice-area/real-estate') },
        { text: 'Intellectual Property Law', href: getPermalink('/practice-area/ip-law') },
  { text: 'Immigration Law', href: getPermalink('/practice-area/immigration-law') },
  { text: 'Personal Injury Law', href: getPermalink('/practice-area/personal-injury-law') },
      ],
    },
    {
      title: 'Resources',
      links: [
        { text: 'Blog', href: getBlogPermalink() },
        { text: 'Free Evaluations', href: getPermalink('/evaluations') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms/english/terms') },
    { text: 'Privacy Policy', href: getPermalink('/terms/english/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: 'https://www.instagram.com/capitollawpartners/' },
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: 'https://www.facebook.com/CapitolLaw/' },
    {
      ariaLabel: 'LinkedIn',
      icon: 'tabler:brand-linkedin',
      href: 'https://www.linkedin.com/company/capitollawpartners',
    },
  ],
  footNote: `
    <strong>
    Attorney Advertising. Content on this website is designed for general information only,<br> and not to be construed as
    formal legal advice or establishment of a lawyer/client relationship. 
    </strong> 
    <br>
    <br>
    <span style="font-size: 0.875rem;">Designed & Developed by <strong>Levent Yanik</strong></span>
    <br>
    <br>
    © Copyright Capitol Law Partners LLC · All Rights Reserved.
    <br>
    <br>
    
  `,
};
export const footerDataTr = {
  links: [
    {
      title: 'Bilgi',
      links: [
        { text: 'Hakkımızda', href: getPermalink('/tr/about') },
        { text: 'Ofislerimiz', href: getPermalink('/tr/locations') },
        { text: 'Bize Ulaşın', href: getPermalink('/tr/contact') },
      ],
    },
    {
      title: 'Ekibimiz',
      links: [
        { text: 'Ekibimizle Tanışın', href: getPermalink('/tr/team') },
        { text: 'Çağatay Ersoy', href: getPermalink('/tr/our-team/cagatay') },
        { text: 'Sena Şahin', href: getPermalink('/tr/our-team/sena') },
        { text: 'Shafeek Seddiq', href: getPermalink('/tr/our-team/shafeek') },
        { text: 'S. Selman Kılıç', href: getPermalink('/tr/our-team/selman') },
        { text: 'Esra Nur Bulan', href: getPermalink('/tr/our-team/esra') },
        { text: 'Mehmet Y. Turkoglu', href: getPermalink('/tr/our-team/mehmet') },
        { text: 'Kemal Şahin', href: getPermalink('/tr/our-team/kemal') },
        { text: 'Omar Bississo', href: getPermalink('/tr/our-team/omar') },
      ],
    },
    {
      title: 'Çalışma Alanları',
      links: [
        { text: 'Danışmanlık Hizmetleri', href: getPermalink('/tr/practice-area/general-counsel-services') },
        { text: 'İş ve Şirketler Hukuku', href: getPermalink('/tr/practice-area/business-corporate-law') },
        { text: 'Vasiyet ve Miras Hukuku', href: getPermalink('/tr/practice-area/estate-planning') },
        { text: 'Gayrimenkul Hukuku', href: getPermalink('/tr/practice-area/real-estate') },
        { text: 'Fikri Mülkiyet Hukuku', href: getPermalink('/tr/practice-area/ip-law') },
        { text: 'Göçmenlik Hukuku', href: getPermalink('/tr/practice-area/immigration-law') },
        { text: 'Kişisel Yaralanma Hukuku', href: getPermalink('/tr/practice-area/personal-injury-law') },
      ],
    },
    {
      title: 'Kaynaklar',
      links: [
        { text: 'Blog', href: getPermalink('/tr/blog') },
        { text: 'Ücretsiz Değerlendirme', href: getPermalink('/tr/evaluations') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Şartlar', href: getPermalink('/terms/turkish/terms') },
    { text: 'Gizlilik Politikası', href: getPermalink('/terms/turkish/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: 'https://www.instagram.com/capitollawpartners/' },
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: 'https://www.facebook.com/CapitolLaw/' },
    {
      ariaLabel: 'LinkedIn',
      icon: 'tabler:brand-linkedin',
      href: 'https://www.linkedin.com/company/capitollawpartners',
    },
  ],
  footNote: `
    <strong>
    Avukat Reklamı. Bu web sitesindeki içerik yalnızca genel bilgilendirme içindir,<br> ve resmi bir hukuki tavsiye veya avukat/müvekkil ilişkisi kurulması olarak yorumlanmamalıdır. 
    </strong> 
    <br>
    <br>
    <span style="font-size: 0.875rem;">Yazılım & Tasarım: <strong>Levent Yanik</strong></span>
    <br>
    <br>
    © Telif Hakkı Capitol Law Partners LLC · Tüm Hakları Saklıdır.
    <br>
    <br>
    
  `,
};

export const footerDataSpanish = {
  links: [
    {
      title: 'Información',
      links: [
        { text: 'Sobre Nosotros', href: getPermalink('/es/about') },
        { text: 'Nuestras Ubicaciones', href: getPermalink('/es/locations') },
        { text: 'Contáctenos', href: getPermalink('/es/contact') },
      ],
    },
    {
      title: 'Nuestro Equipo',
      links: [
        { text: 'Conozca a Nuestro Equipo', href: getPermalink('/es/team') },
        { text: 'Cagatay Ersoy', href: getPermalink('/es/our-team/cagatay') },
        { text: 'Sena Sahin', href: getPermalink('/es/our-team/sena') },
        { text: 'Shafeek Seddiq', href: getPermalink('/es/our-team/shafeek') },
        { text: 'S. Selman Kilic', href: getPermalink('/es/our-team/selman') },
        { text: 'Esra Nur Bulan', href: getPermalink('/es/our-team/esra') },
        { text: 'Mehmet Y. Turkoglu', href: getPermalink('/es/our-team/mehmet') },
        { text: 'Kemal Sahin', href: getPermalink('/es/our-team/kemal') },
        { text: 'Omar Bississo', href: getPermalink('/es/our-team/omar') },
      ],
    },
    {
      title: 'Áreas de Práctica',
      links: [
        { text: 'Servicios de Asesoría General', href: getPermalink('/es/practice-area/general-counsel-services') },
        { text: 'Derecho Empresarial y Corporativo', href: getPermalink('/es/practice-area/business-corporate-law') },
        { text: 'Fideicomisos y Sucesiones', href: getPermalink('/es/practice-area/estate-planning') },
        { text: 'Derecho Inmobiliario', href: getPermalink('/es/practice-area/real-estate') },
        { text: 'Propiedad Intelectual', href: getPermalink('/es/practice-area/ip-law') },
  { text: 'Derecho Migratorio', href: getPermalink('/es/practice-area/immigration-law') },
  { text: 'Lesiones Personales', href: getPermalink('/es/practice-area/personal-injury-law') },
      ],
    },
    {
      title: 'Recursos',
      links: [
        { text: 'Blog', href: getPermalink('/es/blog') },
        { text: 'Evaluaciones gratuitas', href: getPermalink('/es/evaluations') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Términos', href: getPermalink('/terms/spanish/terms') },
    { text: 'Política de Privacidad', href: getPermalink('/terms/spanish/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: 'https://www.instagram.com/capitollawpartners/' },
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: 'https://www.facebook.com/CapitolLaw/' },
    {
      ariaLabel: 'LinkedIn',
      icon: 'tabler:brand-linkedin',
      href: 'https://www.linkedin.com/company/capitollawpartners',
    },
  ],
  footNote: `
    <strong>
    Publicidad de abogados. El contenido de este sitio web se ofrece solo con fines informativos,<br> y no debe interpretarse como asesoramiento legal formal ni como establecimiento de una relación abogado/cliente. 
    </strong> 
    <br>
    <br>
    <span style="font-size: 0.875rem;">Diseñado y desarrollado por <strong>Levent Yanik</strong></span>
    <br>
    <br>
    © Copyright Capitol Law Partners LLC · Todos los derechos reservados.
    <br>
    <br>
    
  `,
};


export const footerDataFr = {
  links: [
    {
      title: 'Informations',
      links: [
        { text: 'À propos de nous', href: getPermalink('/fr/about') },
        { text: 'Nos bureaux', href: getPermalink('/fr/locations') },
        { text: 'Nous contacter', href: getPermalink('/fr/contact') },
      ],
    },
    {
      title: 'Notre équipe',
      links: [
        { text: 'Rencontrez notre équipe', href: getPermalink('/fr/team') },
        { text: 'Cagatay Ersoy', href: getPermalink('/fr/our-team/cagatay') },
        { text: 'Sena Sahin', href: getPermalink('/fr/our-team/sena') },
        { text: 'Shafeek Seddiq', href: getPermalink('/fr/our-team/shafeek') },
        { text: 'S. Selman Kilic', href: getPermalink('/fr/our-team/selman') },
        { text: 'Esra Nur Bulan', href: getPermalink('/fr/our-team/esra') },
        { text: 'Mehmet Y. Turkoglu', href: getPermalink('/fr/our-team/mehmet') },
        { text: 'Kemal Sahin', href: getPermalink('/fr/our-team/kemal') },
        { text: 'Omar Bississo', href: getPermalink('/fr/our-team/omar') },
      ],
    },
    {
      title: 'Domaines de pratique',
      links: [
        { text: 'Conseil juridique externe', href: getPermalink('/fr/practice-area/general-counsel-services') },
        { text: 'Droit des affaires et des sociétés', href: getPermalink('/fr/practice-area/business-corporate-law') },
        { text: 'Trusts et successions', href: getPermalink('/fr/practice-area/estate-planning') },
        { text: 'Droit immobilier', href: getPermalink('/fr/practice-area/real-estate') },
        { text: 'Propriété intellectuelle', href: getPermalink('/fr/practice-area/ip-law') },
  { text: 'Droit de l’immigration', href: getPermalink('/fr/practice-area/immigration-law') },
  { text: 'Préjudice Corporel', href: getPermalink('/fr/practice-area/personal-injury-law') },
      ],
    },
    {
      title: 'Ressources',
      links: [
        { text: 'Blog', href: getPermalink('/fr/blog') },
        { text: 'Évaluations gratuites', href: getPermalink('/fr/evaluations') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Conditions', href: getPermalink('/terms/french/terms') },
    { text: 'Politique de confidentialité', href: getPermalink('/terms/french/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: 'https://www.instagram.com/capitollawpartners/' },
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: 'https://www.facebook.com/CapitolLaw/' },
    {
      ariaLabel: 'LinkedIn',
      icon: 'tabler:brand-linkedin',
      href: 'https://www.linkedin.com/company/capitollawpartners',
    },
  ],
  footNote: `
    <strong>
    Publicité d’avocat. Le contenu de ce site est fourni uniquement à titre informatif,<br> et ne doit pas être interprété comme un conseil juridique formel ni comme l’établissement d’une relation avocat/client. 
    </strong> 
    <br>
    <br>
    <span style="font-size: 0.875rem;">Conçu et développé par <strong>Levent Yanik</strong></span>
    <br>
    <br>
    © Copyright Capitol Law Partners LLC · Tous droits réservés.
    <br>
    <br>
    
  `,
};
export const footerDataPt = {
  links: [
    {
      title: 'Informações',
      links: [
        { text: 'Sobre Nós', href: getPermalink('/pt/about') },
        { text: 'Nossos Escritórios', href: getPermalink('/pt/locations') },
        { text: 'Fale Conosco', href: getPermalink('/pt/contact') },
      ],
    },
    {
      title: 'Nossa Equipe',
      links: [
        { text: 'Conheça Nossa Equipe', href: getPermalink('/pt/team') },
        { text: 'Cagatay Ersoy', href: getPermalink('/pt/our-team/cagatay') },
        { text: 'Sena Sahin', href: getPermalink('/pt/our-team/sena') },
        { text: 'Shafeek Seddiq', href: getPermalink('/pt/our-team/shafeek') },
        { text: 'S. Selman Kilic', href: getPermalink('/pt/our-team/selman') },
        { text: 'Esra Nur Bulan', href: getPermalink('/pt/our-team/esra') },
        { text: 'Mehmet Y. Turkoglu', href: getPermalink('/pt/our-team/mehmet') },
        { text: 'Kemal Sahin', href: getPermalink('/pt/our-team/kemal') },
        { text: 'Omar Bississo', href: getPermalink('/pt/our-team/omar') },

      ],
    },
    {
      title: 'Áreas de Atuação',
      links: [
        { text: 'Consultoria Jurídica Externa', href: getPermalink('/pt/practice-area/general-counsel-services') },
        { text: 'Direito Empresarial e Societário', href: getPermalink('/pt/practice-area/business-corporate-law') },
        { text: 'Trusts e Sucessões', href: getPermalink('/pt/practice-area/estate-planning') },
        { text: 'Direito Imobiliário', href: getPermalink('/pt/practice-area/real-estate') },
        { text: 'Propriedade Intelectual', href: getPermalink('/pt/practice-area/ip-law') },
  { text: 'Direito de Imigração', href: getPermalink('/pt/practice-area/immigration-law') },
  { text: 'Direito de Lesões Pessoais', href: getPermalink('/pt/practice-area/personal-injury-law') },
      ],
    },
    {
      title: 'Recursos',
      links: [
        { text: 'Blog', href: getPermalink('/pt/blog') },
        { text: 'Avaliações gratuitas', href: getPermalink('/pt/evaluations') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Termos', href: getPermalink('/terms/portuguese/terms') },
    { text: 'Política de Privacidade', href: getPermalink('/terms/portuguese/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: 'https://www.instagram.com/capitollawpartners/' },
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: 'https://www.facebook.com/CapitolLaw/' },
    {
      ariaLabel: 'LinkedIn',
      icon: 'tabler:brand-linkedin',
      href: 'https://www.linkedin.com/company/capitollawpartners',
    },
  ],
  footNote: `
    <strong>
    Publicidade de Advogado. O conteúdo deste site é destinado apenas para informações gerais,<br> e não deve ser interpretado como aconselhamento jurídico formal ou criação de uma relação advogado/cliente.
    </strong>
    <br>
    <br>
    <span style="font-size: 0.875rem;">Design & Desenvolvimento por <strong>Levent Yanik</strong></span>
    <br>
    <br>
    © Copyright Capitol Law Partners LLC · Todos os Direitos Reservados.
    <br>
    <br>

    
  `,
};
