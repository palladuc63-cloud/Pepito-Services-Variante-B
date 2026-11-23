import isoCloture from '../assets/iso/cloture-rigide.webp';
import isoGrillage from '../assets/iso/grillage.webp';
import isoPalissade from '../assets/iso/palissade.webp';
import isoPortail from '../assets/iso/portail.webp';
import isoMotorisation from '../assets/iso/motorisation.webp';
import isoMinipelle from '../assets/iso/minipelle.webp';
import heroCloture from '../assets/hero/cloture-rigide-sousbassement.webp';
import type { Project } from './types';

const base = import.meta.env.BASE_URL;

// ── Thème « Signature » : contenu de la landing produit ──
// Tout le texte est regroupé ici pour être facile à modifier et
// partagé entre l'accueil (arguments, processus, activités) et la
// page « Nos services » (hero slideshow + pictos).
export const signature = {
  heroTitle: 'La Clôture Rigide avec Sous-bassement Béton',
  // Photos du hero : diaporama en fondu (~5 s/image, cycle 30 s pour 6).
  // Liste vide = repli auto sur la réalisation « sous-bassement ».
  heroImages: [
    heroCloture.src,
    '/uploads/fb-import/lot-086/lot-086-01-hd.webp',
    '/uploads/fb-import/lot-021/lot-021-01-hd.webp',
  ],
  heroSubtitle:
    'Sécurisez et valorisez votre propriété avec notre solution de clôture grillagée robuste, surélevée sur des plaques de béton de protection contre l’humidité et le passage d’animaux.',
  ctaPrimary: { label: 'Découvrir nos réalisations', href: `${base}realisations/` },
  ctaSecondary: { label: 'Nous contacter', href: `${base}contact/` },
  activitiesTitle: 'Nos activités',
  activities: [
    { img: isoGrillage, label: 'Grillage souple' },
    { img: isoCloture, label: 'Clôture rigide' },
    { img: isoPalissade, label: 'Palissade occultante' },
    { img: isoPortail, label: 'Portails & portillons' },
    { img: isoMotorisation, label: 'Motorisation' },
    { img: isoMinipelle, label: 'Terrassement mini-pelle' },
  ],
  benefitsTitle: 'Pourquoi choisir notre clôture avec sous-bassement béton ?',
  benefits: [
    {
      icon: 'shield',
      title: 'Robustesse maximale',
      text: 'Sécurité, rigidité — les plaques béton stabilisent la clôture et retiennent la terre.',
    },
    {
      icon: 'finish',
      title: 'Finition parfaite et propre',
      text: 'Pas d’entretien de coupe en lisière de grillage — propreté et délimitation claire.',
    },
    {
      icon: 'clock',
      title: 'Longévité exceptionnelle',
      text: 'Anti-humidité : pas de contact du métal avec le sol humide, résistant aux intempéries.',
    },
  ],
  processTitle: 'Notre processus de pose en 5 étapes',
  steps: [
    { title: 'Étude & traçage', text: 'Analyse du terrain, alignement, repères.' },
    { title: 'Terrassement', text: 'Petites excavations pour les poteaux à la mini-pelle.' },
    {
      title: 'Scellement & sous-bassement',
      text: 'Mise en place des poteaux et glissement des plaques de sous-bassement béton.',
    },
    { title: 'Pose des panneaux', text: 'Installation et fixation des grilles en acier rigide.' },
    { title: 'Réception', text: 'Ajustements finaux — chantier livré clé en main.' },
  ],
  installsTitle: 'Nos dernières installations',
};

// Photos du hero : la liste configurée, sinon repli sur la réalisation
// « sous-bassement » la plus récente (sortOrder maximal, tri de l'API :
// sortOrder ASC puis createdAt DESC), sinon « rigide », sinon la
// première avec image.
export function sigHeroImgs(projects: Project[]): string[] {
  if (signature.heroImages.length) return signature.heroImages;
  const hasImg = (p: Project) => p.images?.length || p.imageUrl;
  const haystack = (p: Project) => `${p.title} ${(p.tags || []).join(' ')}`;
  const bestMatch = (re: RegExp) =>
    projects
      .filter((p) => hasImg(p) && re.test(haystack(p)))
      .sort((a, b) => b.sortOrder - a.sortOrder)[0];
  const hero =
    bestMatch(/sous?-?bassement/i) || bestMatch(/rigide/i) || projects.find((p) => hasImg(p));
  return [hero?.images?.[0]?.imageUrl || hero?.imageUrl].filter(Boolean) as string[];
}
