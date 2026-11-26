// Sous-catégories « Services » : une page dédiée par entrée (/<slug>/) +
// les données du dropdown nav (label, gloss, icône, vignette iso, groupe).
// catSlug = slug de catégorie API pour filtrer les réalisations ;
// tag affine à l'intérieur d'une catégorie (ex. 'souple' dans 'clotures').
import isoCloture from '../assets/iso/cloture-rigide.webp';
import isoGrillage from '../assets/iso/grillage.webp';
import isoPalissade from '../assets/iso/palissade.webp';
import isoPortail from '../assets/iso/portail.webp';
import isoMotorisation from '../assets/iso/motorisation.webp';
import isoMinipelle from '../assets/iso/minipelle.webp';
import type { Project } from './types';

export interface ServiceCategory {
  slug: string;
  label: string;
  title: string;
  subtitle: string;
  icon: string;
  image: string;
  group: 'Clôtures' | 'Portails & extérieur' | 'Terrassement';
  desc: string;
  catSlug: string;
  tag?: string;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    slug: 'clotures-rigides',
    label: 'Clôtures rigides',
    title: 'Clôtures rigides',
    subtitle:
      'Panneaux soudés robustes et durables — pose propre, alignement parfait, sans entretien.',
    icon: 'fence',
    image: isoCloture.src,
    group: 'Clôtures',
    desc: 'Panneaux soudés, durables, sans entretien',
    catSlug: 'clotures',
    tag: 'rigide',
  },
  {
    slug: 'clotures-souples',
    label: 'Clôtures souples',
    title: 'Clôtures souples',
    subtitle:
      'Grillage simple torsion tendu sur poteaux — la solution économique et rapide pour délimiter un terrain.',
    icon: 'grillage',
    image: isoGrillage.src,
    group: 'Clôtures',
    desc: 'Grillage simple torsion, économique et rapide',
    catSlug: 'clotures',
    tag: 'souple',
  },
  {
    slug: 'clotures-alu-palissades',
    label: 'Alu & palissades',
    title: 'Clôtures alu & palissades',
    subtitle:
      'Lames aluminium design et occultation sur mesure — modernité, intimité et zéro entretien.',
    icon: 'palissade',
    image: isoPalissade.src,
    group: 'Clôtures',
    desc: 'Lames alu design, occultation sur mesure',
    catSlug: 'clotures-alu-palissades',
  },
  {
    slug: 'portails-portillons',
    label: 'Portails',
    title: 'Portails & portillons',
    subtitle:
      'Battants, coulissants, aluminium sur mesure — l’entrée de votre propriété, soignée dans les détails.',
    icon: 'gate',
    image: isoPortail.src,
    group: 'Portails & extérieur',
    desc: 'Battants, coulissants, alu sur mesure',
    catSlug: 'portails',
  },
  {
    slug: 'motorisation-portail',
    label: 'Motorisation',
    title: 'Motorisation portail',
    subtitle:
      'Automatismes posés, réglés et expliqués sur site — confort au quotidien, sécurité garantie.',
    icon: 'motor',
    image: isoMotorisation.src,
    group: 'Portails & extérieur',
    desc: 'Automatismes posés et réglés sur site',
    catSlug: 'motorisation-portail',
  },
  {
    slug: 'terrassement-mini-pelle',
    label: 'Mini-pelle',
    title: 'Terrassement mini-pelle',
    subtitle:
      'Préparation de terrain, fondations et tranchées — le sol prêt pour vos projets d’extérieur.',
    icon: 'digger',
    image: isoMinipelle.src,
    group: 'Terrassement',
    desc: 'Préparation de terrain et fondations',
    catSlug: 'terrassements',
  },
];

// Réalisations de la sous-catégorie (catégorie API + tag éventuel).
export function catProjects(cat: ServiceCategory, projects: Project[]): Project[] {
  return projects.filter(
    (p) => p.category?.slug === cat.catSlug && (!cat.tag || p.tags?.includes(cat.tag))
  );
}

// Images du carrousel hero : celles de la sous-catégorie d'abord,
// complétées par les autres réalisations.
export function heroImagesFor(cat: ServiceCategory, projects: Project[], max = 6): string[] {
  const inCat = catProjects(cat, projects);
  const rest = projects.filter((p) => !inCat.includes(p));
  const urls = (p: Project) =>
    (p.images?.map((i) => i.imageUrl).filter(Boolean).length
      ? p.images.map((i) => i.imageUrl)
      : [p.imageUrl]
    ).filter(Boolean) as string[];
  return [...inCat, ...rest].flatMap(urls).slice(0, max);
}
