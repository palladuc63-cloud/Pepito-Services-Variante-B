// Rattrapage : met en file les brouillons existants selon le planning.
// Usage : node src/scripts/backfill-schedule.js [city_page|project|article|all]
import { backfillDrafts } from '../utils/schedule.js';
import { cityPages, projects, articles } from '../db/schema.js';

const targets = {
  city_page: cityPages,
  project: projects,
  article: articles,
};

const arg = process.argv[2] ?? 'city_page';
const list = arg === 'all' ? Object.keys(targets) : [arg];

for (const type of list) {
  if (!targets[type]) {
    console.error(`Type inconnu : ${type}`);
    process.exit(1);
  }
  const n = await backfillDrafts(type, targets[type]);
  console.log(`${type}: ${n} brouillon(s) programmé(s)`);
}
process.exit(0);
