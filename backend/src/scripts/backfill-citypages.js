// Rattrapage : rejoue ensureCityPage pour toutes les réalisations
// ayant une ville + une catégorie (ex. import FB qui a écrit en base sans passer par l'API).
// Usage : node src/scripts/backfill-citypages.js
import { isNotNull } from 'drizzle-orm';
import { db } from '../db.js';
import { projects } from '../db/schema.js';
import { ensureCityPage } from '../utils/citygen.js';
import { and } from 'drizzle-orm';

const rows = await db
  .select({ city: projects.city, categoryId: projects.categoryId })
  .from(projects)
  .where(and(isNotNull(projects.city), isNotNull(projects.categoryId)));

const pairs = new Map();
for (const r of rows) pairs.set(`${r.categoryId}|${r.city}`, r);

console.log(`${pairs.size} couples ville × catégorie à traiter :`);
for (const { city, categoryId } of pairs.values()) {
  try {
    await ensureCityPage(city, categoryId);
  } catch (e) {
    console.error(`  ${city} (cat ${categoryId}) : ${e.message}`);
  }
  // ménage pour l'API Nominatim/Wikipedia
  await new Promise(r => setTimeout(r, 1100));
}
console.log('Terminé.');
process.exit(0);
