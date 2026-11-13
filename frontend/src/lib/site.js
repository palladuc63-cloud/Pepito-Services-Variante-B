import { getContent, getProjects } from './api.js';
import { categoryIcon } from './icons.ts';

// Sous-types affichés dans le menu Réalisations, par slug de catégorie.
// Un sous-lien n'apparaît que si au moins une réalisation porte le tag.
const NAV_SUBS = {
  clotures: [
    { tag: 'souple', label: 'Clôtures souples' },
    { tag: 'rigide', label: 'Clôtures rigides' },
    { tag: 'sous-bassement', label: 'Avec sous-bassement' },
  ],
  'clotures-alu-palissades': [{ tag: 'occultant', label: 'Occultants' }],
  portails: [
    { tag: 'battant', label: 'Battants' },
    { tag: 'coulissant', label: 'Coulissants' },
    { tag: 'portillon', label: 'Portillons' },
  ],
  'motorisation-portail': [
    { tag: 'battant', label: 'Battant' },
    { tag: 'coulissant', label: 'Coulissant' },
  ],
};

// Transforme le contenu API (clé/valeur + catégories) en objet "settings"
// compatible avec les composants existants.
export async function getSite() {
  const [{ settings: s, categories, services, slides }, projects] = await Promise.all([
    getContent(),
    getProjects().catch(() => []),
  ]);

  // Vignette du menu = dernière réalisation publiée avec image de la
  // catégorie ; sous-liens = tags réellement présents sur ses projets.
  const catImage = new Map();
  const catTags = new Map();
  const sorted = [...projects].sort(
    (a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0)
  );
  for (const p of sorted) {
    const slug = p.category?.slug;
    if (!slug || !p.published) continue;
    if (!catImage.has(slug) && p.imageUrl) catImage.set(slug, p.imageUrl);
    if (!catTags.has(slug)) catTags.set(slug, new Set());
    for (const t of p.tags || []) catTags.get(slug).add(t);
  }

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
        image: c.imageUrl || catImage.get(c.slug) || undefined,
        icon: categoryIcon(c.slug),
        subs: (NAV_SUBS[c.slug] || [])
          .filter((sub) => catTags.get(c.slug)?.has(sub.tag))
          .map((sub) => ({
            label: sub.label,
            href: `/realisations/?categorie=${c.slug}&tag=${sub.tag}`,
          })),
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
