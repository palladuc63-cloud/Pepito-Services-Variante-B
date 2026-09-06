import cloturesImg from '../../imagesFB/509217954_1158295859645962_722086975202862603_n.jpg';
import occultationImg from '../../imagesFB/509423907_1158295619645986_7675414747217506460_n.jpg';
import portillonsImg from '../../imagesFB/510103629_1162158062593075_1470665586469142132_n.jpg';
import delimitationImg from '../../imagesFB/515879492_1171006688374879_4729343418322258480_n.jpg';
import type { Service } from './types';

export const services: Service[] = [
  {
    id: 'clotures-rigides',
    title: 'Clôtures rigides',
    summary:
      'Pose de clôtures rigides pour délimiter et sécuriser votre propriété.',
    description:
      'Nous proposons la fabrication et la pose de clôtures rigides adaptées à vos besoins. Le choix des matériaux, des hauteurs et des finitions reste à définir ensemble lors d’une visite sur site.',
    image: cloturesImg,
    confirmed: true,
    provisional: true,
  },
  {
    id: 'occultation-palissades',
    title: 'Occultation & palissades',
    summary:
      'Solutions d’occultation et palissades pour préserver votre intimité.',
    description:
      'Lames bois, composite ou autres systèmes d’occultation : nous vous aidons à choisir la solution la plus adaptée à votre jardin et à votre budget, à confirmer lors d’un rendez-vous.',
    image: occultationImg,
    confirmed: true,
    provisional: true,
  },
  {
    id: 'portillons',
    title: 'Portillons',
    summary:
      'Portillons pratiques et esthétiques pour compléter votre clôture.',
    description:
      'Portillons sur mesure, manuels ou équipés d’options à valider ensemble. Les dimensions, le sens d’ouverture et les finitions seront précisés avec vous.',
    image: portillonsImg,
    confirmed: true,
    provisional: true,
  },
  {
    id: 'delimitation-exterieur',
    title: 'Délimitation extérieure',
    summary:
      'Aménagement de la délimitation extérieure de votre terrain.',
    description:
      'Bornes, bordures et aménagements de délimitation extérieure. Les matériaux et les finitions présentés sont des propositions provisoires à valider avec l’entreprise.',
    image: delimitationImg,
    confirmed: true,
    provisional: true,
  },
];
