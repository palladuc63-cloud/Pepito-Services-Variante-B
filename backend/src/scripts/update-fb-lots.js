// Attribue titre personnalisé, ville (<50km de Thiers, max 3/ville) et catégorie
// aux réalisations importées depuis Facebook (chantier-fb-lot-*).
// Usage : node src/scripts/update-fb-lots.js [--apply]
import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { projects } from '../db/schema.js';

const apply = process.argv.includes('--apply');

// [lot, phrase type (identifiée visuellement sur la photo de couverture), catégorie]
// catégories : 1 = Clôtures & palissades · 2 = Portails & portillons · 3 = Petits terrassements
const LOTS = [
  ['lot-001','Pose d’une clôture en panneaux rigides',1],
  ['lot-002','Clôture rigide avec occultation bois',1],
  ['lot-003','Clôture en panneaux sur talus',1],
  ['lot-004','Clôture de terrain en pente',1],
  ['lot-005','Clôture en grillage souple vert',1],
  ['lot-006','Portail métallique vert',2],
  ['lot-013','Portail coulissant vert sur muret',2],
  ['lot-014','Clôture occultante anthracite',1],
  ['lot-015','Préparation de terrain sous clôture',3],
  ['lot-016','Clôture en panneaux verts',1],
  ['lot-017','Clôture grillagée en limite de terrain',1],
  ['lot-018','Palissade brise-vue sur muret en pierre',1],
  ['lot-019','Clôture en bas de muret',1],
  ['lot-020','Grillage de délimitation',1],
  ['lot-021','Clôture rigide avec portillon',1],
  ['lot-022','Clôture anthracite sur muret',1],
  ['lot-023','Clôture grillagée d’un grand terrain',1],
  ['lot-024','Portillon à lames horizontales',2],
  ['lot-025','Pose de clôture sur talus dégagé',1],
  ['lot-026','Aménagement d’une cour en gravier',3],
  ['lot-027','Rénovation d’un portail',2],
  ['lot-028','Clôture sur talus boisé',1],
  ['lot-029','Occultation blanche sur muret',1],
  ['lot-030','Clôture grillagée avec pilier',1],
  ['lot-031','Pose de clôture grillagée',1],
  ['lot-032','Muret et bordure de terrain',3],
  ['lot-033','Clôture en panneaux soudés',1],
  ['lot-034','Clôture rigide devant habitation',1],
  ['lot-035','Portillon et clôture de jardin',2],
  ['lot-036','Clôture en grillage sur poteaux',1],
  ['lot-037','Palissade occultante sur muret',1],
  ['lot-038','Clôture en bordure de haie',1],
  ['lot-039','Clôture en pente arborée',1],
  ['lot-040','Clôture posée sur muret',1],
  ['lot-041','Clôture et portail coulissant',2],
  ['lot-042','Clôture rigide en bordure de maison',1],
  ['lot-043','Clôture en cours de pose',1],
  ['lot-044','Palissade anthracite sur muret',1],
  ['lot-045','Clôture d’un grand terrain',1],
  ['lot-046','Clôture verte en sous-bois',1],
  ['lot-047','Clôture rigide en pose',1],
  ['lot-048','Palissade à lames anthracite',1],
  ['lot-049','Portail battant vert',2],
  ['lot-050','Portillon d’accès piéton',2],
  ['lot-051','Clôture rigide posée en limite',1],
  ['lot-052','Barrière métallique de sécurité',1],
  ['lot-053','Clôture en panneaux sur terrain plat',1],
  ['lot-054','Clôture devant bâtiment',1],
  ['lot-055','Portail battant à lames horizontales',2],
  ['lot-056','Clôture grillagée devant maison',1],
  ['lot-057','Pose de grillage de clôture',1],
  ['lot-058','Clôture grillagée en pose',1],
  ['lot-059','Clôture de chantier avec engin',1],
  ['lot-060','Clôture de bâtiment professionnel',1],
  ['lot-061','Portail coulissant de site professionnel',2],
  ['lot-062','Clôture de site industriel',1],
  ['lot-063','Clôture sur terrain arboré',1],
  ['lot-064','Clôture sur muret en pose',1],
  ['lot-065','Clôture occultante de site professionnel',1],
  ['lot-066','Clôture en limite de propriété arborée',1],
  ['lot-067','Pose de clôture grillagée en campagne',1],
  ['lot-068','Clôture anthracite en panneaux',1],
  ['lot-069','Clôture colorée devant maison',1],
  ['lot-070','Clôture noire en panneaux',1],
  ['lot-071','Clôture et muret en pose',1],
  ['lot-072','Clôture anthracite devant haie',1],
  ['lot-073','Clôture avec portillon de jardin',2],
  ['lot-074','Fendage et rangement de bois',3],
  ['lot-075','Clôture de piscine',1],
  ['lot-076','Portail de site professionnel',2],
  ['lot-077','Clôture en pose sur terrain',1],
  ['lot-078','Débroussaillage de talus',3],
  ['lot-079','Clôture le long d’un chemin',1],
  ['lot-080','Nivellement et préparation de terrain',3],
  ['lot-081','Palissade claire en composite',1],
  ['lot-082','Clôture avec soubassement béton',1],
  ['lot-083','Débroussaillage en forêt',3],
  ['lot-084','À trier — affiche publicitaire Pépito Services',null],
  ['lot-085','Clôture occultante à lames verticales',1],
  ['lot-086','Clôture anthracite sur soubassement',1],
  ['lot-087','Portail à lames horizontales anthracite',2],
  ['lot-088','Clôture le long de la rue',1],
  ['lot-089','Remise en état d’un terrain',3],
  ['lot-090','Coupe et débitage de bois',3],
  ['lot-091','Nettoyage haute pression d’une cour',3],
];

// Villes ≤50 km de Thiers (géocodées/vérifiées), 3 lots max par ville
const CITIES = [
  'Thiers','Escoutoux','La Monnerie-le-Montel','Saint-Rémy-sur-Durolle',
  'Celles-sur-Durolle','Dorat','Néronde-sur-Dore','Palladuc','Paslières',
  'Vollore-Ville','Courpière','Sermentizon','Chabreloche','Bort-l’Étang',
  'Puy-Guillaume','Vollore-Montagne','Lezoux','Ravel','Crevant-Laveine',
  'Sauviat','Augerolles','Moissat','Noirétable','Domaize','Mauzun',
  'Tours-sur-Meymont','Beauregard-l’Évêque','Estandeuil','Olliergues',
];

let updated = 0, notFound = 0;
for (let i = 0; i < LOTS.length; i++) {
  const [lot, phrase, cat] = LOTS[i];
  const city = CITIES[Math.floor(i / 3)];
  const slug = `chantier-fb-${lot}`;
  const title = `${phrase} à ${city}`;
  const [row] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, slug));
  if (!row) { console.log(`  ${slug} : introuvable`); notFound++; continue; }
  console.log(`  ${slug} → « ${title} » [cat ${cat}]`);
  if (apply) {
    await db.update(projects)
      .set({ title, city, categoryId: cat })
      .where(eq(projects.id, row.id));
  }
  updated++;
}
console.log(`\n${updated} réalisations ${apply ? 'mises à jour' : 'à mettre à jour'}, ${notFound} introuvables.`);
process.exit(0);
