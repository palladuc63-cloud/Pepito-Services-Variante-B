import { getContent } from './api.js';
import { categoryIcon } from './icons.ts';

// Transforme le contenu API (clé/valeur + catégories) en objet "settings"
// compatible avec les composants existants.
export async function getSite() {
  const { settings: s, categories, services, slides } = await getContent();

  const socials = [];
  if (s.facebook_url) socials.push({ name: 'Facebook', url: s.facebook_url });
  if (s.instagram_url) socials.push({ name: 'Instagram', url: s.instagram_url });
  if (s.google_profile_url) socials.push({ name: 'Google', url: s.google_profile_url });

  const nav = [
    { label: 'Accueil', href: '/', icon: 'home' },
    { label: 'A propos', href: '/a-propos/', icon: 'artisan' },
    {
      label: 'Réalisations',
      href: '/realisations/',
      icon: 'images',
      children: categories.map((c) => ({
        label: c.label,
        href: `/realisations/?categorie=${c.slug}`,
        image: c.imageUrl || undefined,
        icon: categoryIcon(c.slug),
      })),
    },
    { label: 'Actualités', href: '/actualites/', icon: 'news' },
    { label: 'Contact', href: '/contact/', icon: 'mail' },
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
