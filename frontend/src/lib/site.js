import { getContent } from './api.js';

// Transforme le contenu API (clé/valeur + catégories) en objet "settings"
// compatible avec les composants existants.
export async function getSite() {
  const { settings: s, categories, services } = await getContent();

  const socials = [];
  if (s.facebook_url) socials.push({ name: 'Facebook', url: s.facebook_url });
  if (s.instagram_url) socials.push({ name: 'Instagram', url: s.instagram_url });

  const nav = [
    { label: 'Accueil', href: '/' },
    { label: 'A propos', href: '/a-propos/' },
    {
      label: 'Réalisations',
      href: '/realisations/',
      children: categories.map((c) => ({
        label: c.label,
        href: `/realisations/?categorie=${c.slug}`,
        image: c.imageUrl || undefined,
      })),
    },
    { label: 'Actualités', href: '/actualites/' },
    { label: 'Contact', href: '/contact/' },
  ];

  return {
    categories,
    services,
    settings: {
      name: s.site_name || 'Pépito Services',
      baseline: s.baseline || '',
      description: s.description || '',
      logo: s.logo_url || '/logo.svg',
      siteUrl: (import.meta.env.SITE || 'https://pepito-services.fr').replace(/\/$/, ''),
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
    },
  };
}
