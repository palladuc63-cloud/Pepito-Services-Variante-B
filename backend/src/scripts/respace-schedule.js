// Re-planifie toute la file : max 1 pub/semaine sur les 3 semaines en cours/à venir,
// puis max 2/semaine ensuite — tous types confondus, ordre actuel conservé.
// Créneaux : mardi 9h (1/sem) puis mardi + vendredi 9h (2/sem).
// Usage : node src/scripts/respace-schedule.js [--apply]
import { gt, asc, and, lt, gte, eq } from 'drizzle-orm';
import { db } from '../db.js';
import { projects, articles, cityPages } from '../db/schema.js';

const apply = process.argv.includes('--apply');
const TABLES = { project: projects, article: articles, city_page: cityPages };
const D = 864e5;

// Lundi 00:00 de la semaine courante
const now = new Date();
const monday = new Date(now); monday.setHours(0, 0, 0, 0);
monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

const slotAt = (weekIdx, fri) => {
  const d = new Date(monday.getTime() + weekIdx * 7 * D + (fri ? 4 * D : D));
  d.setHours(9, 0, 0, 0);
  return d;
};

// Récupère la file future + les publications déjà passées cette semaine
const queue = [];
let consumedThisWeek = 0;
for (const [type, t] of Object.entries(TABLES)) {
  const fut = await db.select({ id: t.id, title: t.title ?? t.city, at: t.publishedAt })
    .from(t).where(gt(t.publishedAt, now)).orderBy(asc(t.publishedAt));
  for (const r of fut) queue.push({ type, table: t, ...r });
  const past = await db.select({ id: t.id }).from(t)
    .where(and(gte(t.publishedAt, monday), lt(t.publishedAt, now)));
  consumedThisWeek += past.length;
}
queue.sort((a, b) => +new Date(a.at) - +new Date(b.at));

console.log(`${queue.length} éléments à re-planifier, ${consumedThisWeek} publication(s) déjà passée(s) cette semaine.`);

// Semaines 0,1,2 → 1 créneau (mardi) ; semaines ≥3 → 2 créneaux (mardi + vendredi)
const assigned = {};
let wi = 0, shown = 0, last;
for (const item of queue) {
  let slot;
  for (;;) {
    const cap = wi < 3 ? 1 : 2;
    const used = (assigned[wi] ?? 0) + (wi === 0 ? consumedThisWeek : 0);
    if (used >= cap) { wi++; continue; }
    slot = wi < 3 ? slotAt(wi, false) : slotAt(wi, used > 0);
    if (slot <= now) { wi++; continue; }
    break;
  }
  assigned[wi] = (assigned[wi] ?? 0) + 1;
  last = slot;
  if (shown < 8 || item === queue.at(-1)) {
    console.log(`  ${slot.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })} → [${item.type}] ${item.title}`);
    shown++;
  } else if (shown === 8) { console.log('  …'); shown++; }
  if (apply) {
    await db.update(item.table).set({ publishedAt: slot }).where(eq(item.table.id, item.id));
  }
}
console.log(`Dernier créneau : ${last?.toLocaleDateString('fr-FR') ?? '—'}${apply ? '' : ' (dry-run)'}`);
process.exit(0);
