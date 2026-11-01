// Import des lots de photos Facebook triés en réalisations BROUILLON.
// Prérequis : les photos sont déjà copiées dans storage/uploads/fb-import/lot-XXX/
// Usage : node src/scripts/import-lots.js [--apply] [--skip=lot-007,lot-008]
// Sans --apply : dry-run (compte-rendu uniquement). Relançable sans doublon
// (slug `chantier-fb-lot-XXX` unique + tag `lot:lot-XXX`).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { like, sql } from 'drizzle-orm';
import { db } from '../db.js';
import { projects, projectImages } from '../db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'storage', 'uploads');
const SRC_DIR = path.join(UPLOAD_ROOT, 'fb-import');

const apply = process.argv.includes('--apply');
const skipArg = process.argv.find(a => a.startsWith('--skip='));
// Lots déjà publiés manuellement (leurs photos sont en ligne) — exclus par défaut.
const SKIP = new Set(
  (skipArg ? skipArg.slice(7).split(',') : ['lot-007','lot-008','lot-009','lot-010','lot-011','lot-012'])
    .map(s => s.trim()).filter(Boolean)
);

if (!fs.existsSync(SRC_DIR)) {
  console.error(`Dossier introuvable : ${SRC_DIR}`);
  console.error('Copier d\'abord les lots dans storage/uploads/fb-import/lot-XXX/');
  process.exit(1);
}

const lots = fs.readdirSync(SRC_DIR)
  .filter(d => /^lot-\d+$/.test(d) && fs.statSync(path.join(SRC_DIR, d)).isDirectory())
  .sort();

console.log(`${lots.length} lots détectés dans ${SRC_DIR}${apply ? '' : ' (dry-run)'}`);

// Projets déjà importés (anti-doublon)
const [existing] = await db
  .select({ slug: projects.slug })
  .from(projects)
  .where(like(projects.slug, 'chantier-fb-lot-%'));
const done = new Set(existing.map(p => p.slug));

const [[{ maxOrder }]] = await db
  .select({ maxOrder: sql`COALESCE(MAX(sort_order),0)` })
  .from(projects);
let order = Number(maxOrder) + 1;

let created = 0, skipped = 0, missing = 0;
for (const lot of lots) {
  const slug = `chantier-fb-${lot}`;
  if (SKIP.has(lot)) { console.log(`  ${lot} : ignoré (déjà publié)`); skipped++; continue; }
  if (done.has(slug)) { console.log(`  ${lot} : déjà importé`); skipped++; continue; }

  const photos = fs.readdirSync(path.join(SRC_DIR, lot))
    .filter(f => /\.(webp|jpe?g|png)$/i.test(f))
    .sort();
  if (!photos.length) { console.log(`  ${lot} : aucune photo`); missing++; continue; }

  const urls = photos.map(f => `/uploads/fb-import/${lot}/${f}`);
  console.log(`  ${lot} : ${photos.length} photos → ${slug}`);

  if (apply) {
    const [r] = await db.insert(projects).values({
      slug,
      title: `Chantier FB — ${lot.replace('lot-', 'lot ')}`,
      categoryId: null,
      summary: null,
      description: null,
      imageUrl: urls[0],
      city: null,
      tags: ['À valider', 'fb-import', `lot:${lot}`],
      published: false,
      publishedAt: null,
      sortOrder: order++,
    });
    const pid = r.insertId;
    for (let i = 0; i < urls.length; i++) {
      await db.insert(projectImages).values({ projectId: pid, imageUrl: urls[i], sortOrder: i });
    }
  }
  created++;
}

console.log(`\n${created} réalisations ${apply ? 'créées (brouillons)' : 'à créer'}, ${skipped} ignorées, ${missing} vides.`);
if (!apply) console.log('Relancer avec --apply pour écrire en base.');
process.exit(0);
