// Fusionne les pages villes en doublon (même ville, plusieurs services)
// en une seule URL /clotures-portails/<ville>/.
// Usage: node src/scripts/merge-citypages.js [--apply]
import { db } from '../db.js';
import { cityPages, services, seoMeta, redirects } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';

const APPLY = process.argv.includes('--apply');
const COMBINED_SLUG = 'clotures-portails';

// Libellé combiné selon l'ensemble des services fusionnés
function combinedLabel(serviceSlugs) {
  const s = new Set(serviceSlugs);
  const c = s.has('clotures-palissades'), p = s.has('portails-portillons'), t = s.has('petits-terrassements');
  if (c && p && t) return 'Clôtures, portails & terrassements';
  if (c && p) return 'Clôtures & portails';
  if (c && t) return 'Clôtures & terrassements';
  if (p && t) return 'Portails & terrassements';
  return null; // pas de fusion pertinente
}

// Remplace les mentions du service dans le contenu/meta par le libellé combiné.
function relabel(text, fromTitles, label) {
  let out = text ?? '';
  for (const t of fromTitles) {
    out = out.split(t).join(label).split(t.toLowerCase()).join(label.toLowerCase());
  }
  return out;
}

const [pages, svcRows] = await Promise.all([
  db.select().from(cityPages),
  db.select().from(services),
]);
const svcTitle = Object.fromEntries(svcRows.map((s) => [s.slug, s.title]));

// Service virtuel pour l'espace URL combiné (inactif : absent du site public)
const hasCombined = svcRows.some((s) => s.slug === COMBINED_SLUG);
console.log(`service « ${COMBINED_SLUG} » : ${hasCombined ? 'existe' : 'à créer'}`);

const byCity = new Map();
for (const p of pages) {
  const g = byCity.get(p.slug) ?? [];
  g.push(p);
  byCity.set(p.slug, g);
}

let mergedCount = 0, deletedCount = 0;
for (const [slug, group] of byCity) {
  if (group.length < 2 || group.some((p) => p.serviceSlug === COMBINED_SLUG)) continue;
  const label = combinedLabel(group.map((p) => p.serviceSlug));
  if (!label) { console.log(`skip ${slug} (${group.map((p) => p.serviceSlug).join('+')})`); continue; }

  // Page conservée : publication la plus proche, sinon plus ancien id
  const sorted = [...group].sort((a, b) =>
    (a.publishedAt ? new Date(a.publishedAt).getTime() : Infinity) -
    (b.publishedAt ? new Date(b.publishedAt).getTime() : Infinity) || a.id - b.id);
  const keeper = sorted[0];
  const others = sorted.slice(1);
  const titles = [...new Set(group.map((p) => svcTitle[p.serviceSlug]).filter(Boolean))];
  const city = keeper.city;
  const title = `${label} à ${city}`;
  const dates = group.map((p) => p.publishedAt).filter(Boolean).map((d) => new Date(d));
  const publishedAt = dates.length ? new Date(Math.min(...dates)) : null;
  const published = group.some((p) => p.published);

  console.log(`${city} : ${group.map((p) => p.serviceSlug).join(' + ')} → /${COMBINED_SLUG}/${slug}/ (${published ? 'pub' : 'draft'} ${publishedAt ? publishedAt.toISOString().slice(0, 10) : ''})`);
  mergedCount++;
  deletedCount += others.length;

  if (!APPLY) continue;
  await db.update(cityPages).set({
    serviceSlug: COMBINED_SLUG,
    title,
    content: relabel(keeper.content, titles, label),
    published,
    publishedAt,
  }).where(eq(cityPages.id, keeper.id));

  // Meta SEO du gardien : remplace le service dans titre/description
  const [meta] = await db.select().from(seoMeta)
    .where(and(eq(seoMeta.entityType, 'city_page'), eq(seoMeta.entityId, keeper.id)));
  if (meta) {
    await db.update(seoMeta).set({
      metaTitle: relabel(meta.metaTitle, titles, label),
      metaDesc: relabel(meta.metaDesc, titles, label),
    }).where(eq(seoMeta.id, meta.id));
  }

  // Redirections 301 + suppression des doublons (et leurs metas)
  for (const o of others) {
    const oldPath = `/${o.serviceSlug}/${o.slug}/`;
    const newPath = `/${COMBINED_SLUG}/${o.slug}/`;
    await db.insert(redirects).values({ oldPath, newPath, status: 301 })
      .onDuplicateKeyUpdate({ set: { newPath, status: 301 } });
    await db.delete(seoMeta).where(and(eq(seoMeta.entityType, 'city_page'), eq(seoMeta.entityId, o.id)));
    await db.delete(cityPages).where(eq(cityPages.id, o.id));
  }
}

if (APPLY && !hasCombined) {
  await db.insert(services).values({
    slug: COMBINED_SLUG,
    title: 'Clôtures & portails',
    summary: 'Pose de clôtures, palissades, portails et portillons.',
    description: 'Ensemble des prestations d\'aménagement extérieur : clôtures, palissades, portails et portillons.',
    confirmed: true, provisional: true, active: false, sortOrder: 99,
  });
  console.log(`service « ${COMBINED_SLUG} » créé (inactif)`);
}

console.log(APPLY
  ? `Fusionné : ${mergedCount} villes, ${deletedCount} pages supprimées`
  : `DRY-RUN : ${mergedCount} villes à fusionner, ${deletedCount} pages à supprimer`);
process.exit(0);
