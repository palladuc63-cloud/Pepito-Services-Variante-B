import projet01 from '../../imagesFB/526667199_1193094866166061_2591278162826548176_n.jpg';
import projet02 from '../../imagesFB/526747947_1193094626166085_5444967661889720550_n.jpg';
import projet03 from '../../imagesFB/548881804_1230845459057668_4375543893482562231_n.jpg';
import projet04 from '../../imagesFB/593997222_1299146238894256_7111244287217579699_n.jpg';
import projet05 from '../../imagesFB/595923527_1300166818792198_3149958148292069886_n.jpg';
import projet06 from '../../imagesFB/605111144_1313335420808671_4322054820875846881_n.jpg';
import projet07 from '../../imagesFB/623332063_1342261117916101_1956875220114118373_n.jpg';
import projet08 from '../../imagesFB/632342391_1354493173359562_2227672343321464994_n.jpg';
import projet09 from '../../imagesFB/637782513_1360817009393845_2058624423555773206_n.jpg';
import projet10 from '../../imagesFB/638047643_1359968719478674_538155947428496695_n.jpg';
import type { Project, ProjectCategoryInfo } from './types';

export const projectCategories: ProjectCategoryInfo[] = [
  { id: 'clotures-rigides', label: 'Clôtures rigides' },
  { id: 'occultation-palissades', label: 'Occultation & palissades' },
  { id: 'portillons', label: 'Portillons' },
  { id: 'delimitation-exterieur', label: 'Délimitation extérieure' },
];

export const projects: Project[] = [
  {
    id: 'projet-01',
    title: 'Clôture rigide — chantier résidentiel',
    category: 'clotures-rigides',
    summary: 'Pose d’un ensemble de panneaux rigides pour clôturer un jardin.',
    description:
      'Ce chantier illustre une installation de clôture rigide. Les dimensions, les matériaux et le lieu exact restent à confirmer avec l’entreprise.',
    image: projet01,
    tags: ['À valider'],
  },
  {
    id: 'projet-02',
    title: 'Palissade d’occultation',
    category: 'occultation-palissades',
    summary: 'Palissade en lames pour préserver l’intimité d’une terrasse.',
    description:
      'Exemple de palissade / occultation. Les essences de bois, la hauteur et les finitions sont des propositions provisoires.',
    image: projet02,
    tags: ['À valider'],
  },
  {
    id: 'projet-03',
    title: 'Portillon d’accès',
    category: 'portillons',
    summary: 'Portillon intégré à une clôture pour un accès piéton.',
    description:
      'Portillon sur mesure, à compléter avec les spécifications réelles lors de la validation du contenu.',
    image: projet03,
    tags: ['À valider'],
  },
  {
    id: 'projet-04',
    title: 'Délimitation de terrain',
    category: 'delimitation-exterieur',
    summary: 'Aménagement de la limite extérieure d’une propriété.',
    description:
      'Travaux de délimitation extérieure. Les détails techniques et la localisation sont à valider avec Pépito Services.',
    image: projet04,
    tags: ['À valider'],
  },
  {
    id: 'projet-05',
    title: 'Clôture rigide — ligne de propriété',
    category: 'clotures-rigides',
    summary: 'Ligne de clôture rigide installée en périphérie d’un terrain.',
    description:
      'Réalisation représentant une clôture rigide. Informations complémentaires à fournir par l’entreprise.',
    image: projet05,
    tags: ['À valider'],
  },
  {
    id: 'projet-06',
    title: 'Occultation sur mesure',
    category: 'occultation-palissades',
    summary: 'Panneau d’occultation adapté à une clôture existante.',
    description:
      'Exemple d’occultation. Le type de remplissage et les options restent à préciser avec le client.',
    image: projet06,
    tags: ['À valider'],
  },
  {
    id: 'projet-07',
    title: 'Portillon et clôture',
    category: 'portillons',
    summary: 'Portillon associé à un ensemble de clôture.',
    description:
      'Portillon et accessoires. Description provisoire en attente de validation.',
    image: projet07,
    tags: ['À valider'],
  },
  {
    id: 'projet-08',
    title: 'Bordure et délimitation',
    category: 'delimitation-exterieur',
    summary: 'Pose de bordures pour structurer l’espace extérieur.',
    description:
      'Aménagement de bordures et délimitation. Détails à confirmer.',
    image: projet08,
    tags: ['À valider'],
  },
  {
    id: 'projet-09',
    title: 'Clôture rigide avec soubassement',
    category: 'clotures-rigides',
    summary: 'Clôture rigide complétée d’un soubassement.',
    description:
      'Réalisation d’une clôture rigide avec option soubassement. Données à valider.',
    image: projet09,
    tags: ['À valider'],
  },
  {
    id: 'projet-10',
    title: 'Palissade décorative',
    category: 'occultation-palissades',
    summary: 'Palissade alliant occultation et esthétique.',
    description:
      'Palissade décorative. Description en cours de validation avec l’entreprise.',
    image: projet10,
    tags: ['À valider'],
  },
];
