// Planifie le backlog de brouillons avec un intervalle personnalisé
// (indépendant de la cadence du media planning, pensé pour l'écoulement des imports).
// Usage : node src/scripts/plan-backlog.js <project|article|city_page> [--days=4] [--start=YYYY-MM-DD] [--apply]
import { isNull, asc, or, eq, and } from 'drizzle-orm';
import { db } from '../db.js';
import { projects, articles, cityPages } from '../db/schema.js';

const tables = { project: projects, article: articles, city_page: cityPages };
const type = process.argv[2];
const table = tables[type];
if (!table) { console.error('Type attendu : project | article | city_page'); process.exit(1); }

const apply = process.argv.includes('--apply');
const days = Number(process.argv.find(a => a.startsWith('--days='))?.slice(7) ?? 4);
const startArg = process.argv.find(a => a.startsWith('--start='))?.slice(8);
const start = startArg ? new Date(`${startArg}T09:00:00`) : (() => {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d;
})();

// Brouillons non planifiés (pas encore publiés ET pas de date)
const rows = await db.select({ id: table.id, title: table.title ?? table.city })
  .from(table)
  .where(and(eq(table.published, false), isNull(table.publishedAt)))
  .orderBy(asc(table.id));

console.log(`${rows.length} brouillons ${type} — intervalle ${days}j dès ${start.toISOString().slice(0, 10)}${apply ? '' : ' (dry-run)'}`);
for (let i = 0; i < rows.length; i++) {
  const at = new Date(start); at.setDate(at.getDate() + i * days);
  if (i < 5 || i === rows.length - 1) console.log(`  ${at.toLocaleDateString('fr-FR')} → ${rows[i].title}`);
  else if (i === 5) console.log('  …');
  if (apply) {
    await db.update(table)
      .set({ published: true, publishedAt: at })
      .where(eq(table.id, rows[i].id));
  }
}
console.log(`Dernier créneau : ${new Date(start.getTime() + (rows.length - 1) * days * 864e5).toLocaleDateString('fr-FR')}`);
process.exit(0);
