import { getContent } from './api.js';
import isoCloture from '../assets/iso/cloture-rigide.webp';
import isoPalissade from '../assets/iso/palissade.webp';
import isoPortail from '../assets/iso/portail.webp';
import isoMotorisation from '../assets/iso/motorisation.webp';
import isoMinipelle from '../assets/iso/minipelle.webp';

// Transforme le contenu API (clé/valeur + catégories) en objet "settings"
// compatible avec les composants existants.
export async function getSite() {
  const { settings: s, categories, services, slides } = await getContent();

  const socials = [];
  if (s.facebook_url) socials.push({ name: 'Facebook', url: s.facebook_url });
  if (s.instagram_url) socials.push({ name: 'Instagram', url: s.instagram_url });
  if (s.google_profile_url) socials.push({ name: 'Google', url: s.google_profile_url });

  // Menu : 3 liens + bouton « Demander un devis ».
  const nav = [
    { label: 'Accueil', href: '/', icon: 'home' },
    {
      label: 'Services',
      href: '/services/',
      icon: 'fence',
      children: [
        {
          label: 'Clôtures rigides',
          href: '/realisations/?categorie=clotures',
          icon: 'fence',
          image: isoCloture.src,
        },
        {
          label: 'Clôtures alu & palissades',
          href: '/realisations/?categorie=clotures-alu-palissades',
          icon: 'palissade',
          image: isoPalissade.src,
        },
        {
          label: 'Portails & portillons',
          href: '/realisations/?categorie=portails',
          icon: 'gate',
          image: isoPortail.src,
        },
        {
          label: 'Motorisation portail',
          href: '/realisations/?categorie=motorisation-portail',
          icon: 'motor',
          image: isoMotorisation.src,
        },
        {
          label: 'Terrassement mini-pelle',
          href: '/realisations/?categorie=terrassements',
          icon: 'digger',
          image: isoMinipelle.src,
        },
      ],
    },
    { label: 'Réalisations', href: '/realisations/', icon: 'grid' },
  ];

  return {
    categories,
    services,
    slides: slides || [],
    settings: {
      name: s.site_name || 'Pépito Services',
      baseline: s.baseline || '',
      description: s.description || '',
      logo: s.logo_url || '/pepito-logo.svg',
      siteUrl:
        (import.meta.env.SITE || 'https://pepito-services.fr').replace(/\/$/, '') +
        (import.meta.env.BASE_URL || '/'),
      socials,
      contact: {
        phone: s.phone || null,
        email: s.email || null,
        address: s.address || null,
        serviceArea: s.service_area || null,
        hours: s.hours || null,
      },
      aboutText: s.about_text || '',
      nav,
      // Profils externes vérifiés — maillage SEO (sameAs JSON-LD).
      googleProfileUrl: s.google_profile_url || '',
      sameAs: socials.map((so) => so.url),
    },
  };
}
