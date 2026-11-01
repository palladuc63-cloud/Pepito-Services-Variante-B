// ─── Planification automatique des publications ─────────────
// Config stockée en settings.schedule_config (JSON) :
// { project|article|city_page: { enabled, intervalDays, weekday, hour } }
// weekday : 0=dimanche … 6=samedi (getDay() JS)
import { eq, gt, asc } from 'drizzle-orm';
import { db } from '../db.js';
import { settings } from '../db/schema.js';

export const SCHEDULE_KEY = 'schedule_config';

export const DEFAULT_SCHEDULE = {
  project: { enabled: true, intervalDays: 30, weekday: 2, hour: 9 },   // ~1×/mois, mardi 9h
  article: { enabled: true, intervalDays: 30, weekday: 4, hour: 9 },   // ~1×/mois, jeudi 9h
  city_page: { enabled: true, intervalDays: 7, weekday: 2, hour: 9 },  // 1×/sem, mardi 9h
};

export async function getSchedule() {
  const [row] = await db.select().from(settings).where(eq(settings.key, SCHEDULE_KEY));
  let conf = {};
  try {
    conf = row?.value ? JSON.parse(row.value) : {};
  } catch {
    conf = {};
  }
  return Object.fromEntries(
    Object.entries(DEFAULT_SCHEDULE).map(([k, v]) => [k, { ...v, ...(conf[k] ?? {}) }])
  );
}

// Prochain créneau libre pour un type : après la programmation la plus
// lointaine (+ l'intervalle), calé sur le jour/heure autorisés.
// File vide → prochain jour autorisé à venir.
export async function nextSlot(type, table) {
  const conf = (await getSchedule())[type];
  if (!conf?.enabled) return null;
  const now = new Date();
  const rows = await db
    .select({ d: table.publishedAt })
    .from(table)
    .where(gt(table.publishedAt, now));
  let last = null;
  for (const r of rows) if (r.d && (!last || r.d > last)) last = r.d;
  const cursor = last
    ? new Date(last.getTime() + conf.intervalDays * 864e5)
    : new Date(now);
  cursor.setHours(conf.hour ?? 9, 0, 0, 0);
  while (cursor.getDay() !== conf.weekday || cursor <= now) {
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(conf.hour ?? 9, 0, 0, 0);
  }
  return cursor;
}

// Met en file les brouillons existants (published=false), dans l'ordre
// de création : chacun prend le créneau libre suivant. Un brouillon qui
// a déjà une date future est laissé tel quel.
export async function backfillDrafts(type, table) {
  const conf = (await getSchedule())[type];
  if (!conf?.enabled) return 0;
  const now = new Date();
  const drafts = await db
    .select()
    .from(table)
    .where(eq(table.published, false))
    .orderBy(asc(table.id));
  let n = 0;
  for (const d of drafts) {
    if (d.publishedAt && d.publishedAt > now) continue;
    const slot = await nextSlot(type, table);
    if (!slot) break;
    await db
      .update(table)
      .set({ published: true, publishedAt: slot })
      .where(eq(table.id, d.id));
    n++;
  }
  return n;
}
