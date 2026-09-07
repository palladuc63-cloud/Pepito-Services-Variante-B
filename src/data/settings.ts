import logo from '../assets/logo.svg';
import type { SiteSettings } from './types';
import { projectCategories, projects } from './projects';

function randomProjectImage(categoryId: string) {
  const categoryProjects = projects.filter((p) => p.category === categoryId);
  if (categoryProjects.length === 0) return undefined;
  const index = Math.floor(Math.random() * categoryProjects.length);
  return categoryProjects[index].image;
}

export const settings: SiteSettings = {
  name: 'Pépito Services',
  baseline: 'Clôtures, palissades et aménagements extérieurs sur mesure',
  description:
    'Pépito Services vous accompagne dans la pose et la fabrication de clôtures rigides, palissades, portillons et aménagements d’extérieur. Demandez un chiffrage personnalisé.',
  logo,
  siteUrl: 'https://palladuc63-cloud.github.io/Pepito-Services-Variante-B/',
  socials: [
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/profile.php?id=100063966765186',
    },
  ],
  contact: {
    phone: null,
    email: null,
    address: null,
    serviceArea: null,
  },
  nav: [
    { label: 'Accueil', href: '/' },
    { label: 'A propos', href: '/a-propos/' },
    {
      label: 'Réalisations',
      href: '/realisations/',
      children: projectCategories.map((category) => ({
        label: category.label,
        href: `/realisations/?categorie=${category.id}`,
        image: randomProjectImage(category.id),
      })),
    },
    { label: 'Contact', href: '/contact/' },
  ],
};
