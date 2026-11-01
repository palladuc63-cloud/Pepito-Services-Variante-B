// Génération automatique des pages villes (SEO local).
// Source descriptive : résumé Wikipédia FR (CC BY-SA — attribution incluse).
// Géocodage : coordonnées renvoyées par Wikipédia, fallback Nominatim.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq, asc, and, like } from 'drizzle-orm';
import { db } from '../db.js';
import { cityPages, categories, services, seoMeta } from '../db/schema.js';
import { slugify } from './slug.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'storage', 'uploads');

const UA = 'PepitoServices-SiteBuilder/1.0 (contact@pepito-services.fr)';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function fetchCityInfo(city) {
  const info = { extract: null, lat: null, lng: null, wikiUrl: null, image: null };
  try {
    const title = encodeURIComponent(city.trim().replace(/ /g, '_'));
    const res = await fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const j = await res.json();
      if (j.extract && j.type !== 'disambiguation') {
        info.extract = j.extract;
        info.wikiUrl = j.content_urls?.desktop?.page ?? null;
        info.image = (j.originalimage?.source ?? j.thumbnail?.source ?? '').split('?')[0] || null;
      }
      if (j.coordinates) { info.lat = j.coordinates.lat; info.lng = j.coordinates.lon; }
    }
  } catch {}
  if (info.lat === null) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=${encodeURIComponent(city)}`,
        { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) },
      );
      const [j] = res.ok ? await res.json() : [];
      if (j) { info.lat = Number(j.lat); info.lng = Number(j.lon); }
    } catch {}
  }
  return info;
}

// Données officielles de la commune (geo.api.gouv.fr) : code postal,
// département, population — rend le contenu unique par ville.
export async function fetchCityGeo(city) {
  try {
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(city.trim())}&fields=nom,code,codesPostaux,population,surface,codeDepartement&boost=population&limit=5`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const target = slugify(city);
    const row = rows.find((r) => slugify(r.nom) === target) ?? rows[0];
    if (!row) return null;
    return {
      code: row.code,
      postal: row.codesPostaux?.[0] ?? null,
      dept: row.codeDepartement ?? null,
      population: row.population ?? null,
      surfaceKm2: row.surface ? Math.round(row.surface / 100) : null,
    };
  } catch { return null; }
}

// Télécharge la photo de la ville en local (vignette 960px quand
// Wikimedia — tailles fixes imposées) pour ne pas servir les originaux.
export async function downloadCityImage(imageUrl, serviceSlug, slug) {
  const m = imageUrl.match(/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?([0-9a-f])\/([0-9a-f]{2})\/([^/?]+)/i);
  const candidates = [];
  if (m) {
    candidates.push(`https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${m[3]}/960px-${m[3].replace(/\.svg$/i, '.svg.png')}`);
  }
  candidates.push(imageUrl);
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const ct = (res.headers.get('content-type') ?? '').toLowerCase();
      if (!ct.startsWith('image/')) continue;
      const ext = ct.includes('png') ? '.png' : ct.includes('webp') ? '.webp' : ct.includes('avif') ? '.avif' : '.jpg';
      const file = `city-${serviceSlug}-${slug}${ext}`;
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(path.join(UPLOAD_DIR, file), Buffer.from(await res.arrayBuffer()));
      return `/uploads/${file}`;
    } catch {}
  }
  return imageUrl; // échec réseau : conserve l'URL distante
}

// Contenu unique par ville : extrait Wikipédia propre à la commune +
// données officielles + blocs locaux (chantiers/maillage au rendu).
export function buildCityContent({ city, serviceTitle, extract, wikiUrl, geo }) {
  const svc = esc(serviceTitle);
  const cp = geo?.postal ? ` (${geo.postal})` : '';
  const paras = [
    `<p><strong>${svc} à ${esc(city)}${cp}</strong> : Pépito Services prend en charge vos projets de ${svc.toLowerCase()} sur ${esc(city)} et ses environs. Devis gratuit, visite technique sur place avant tout chiffrage.</p>`,
  ];
  if (geo?.population) {
    const bits = [`${esc(city)} compte environ ${geo.population.toLocaleString('fr-FR')} habitants`];
    if (geo.surfaceKm2) bits.push(`sur un territoire de ${geo.surfaceKm2} km²`);
    if (geo.dept) bits.push(`, dans le département ${geo.dept}`);
    paras.push(`<p>${bits.join(' ')} : nos équipes interviennent dans tous les quartiers ainsi que dans les communes voisines, pour les particuliers comme pour les professionnels.</p>`);
  }
  if (extract) {
    const cleaned = extract.replace(/,\s*,/g, ',');
    const short = cleaned.length > 420 ? `${cleaned.slice(0, 420).replace(/\s+\S*$/, '')}…` : cleaned;
    paras.push(`<p>${esc(short)}${wikiUrl ? ` <a href="${wikiUrl}" rel="noopener" target="_blank">(source : Wikipédia)</a>` : ''}</p>`);
  }
  paras.push(`<p>Nous connaissons le terrain et les contraintes locales de ${esc(city)} : chaque chantier est précédé d'une étude sur place, d'un conseil sur les matériaux adaptés et d'une pose soignée.</p>`);
  paras.push(`<p>Vous avez un projet à ${esc(city)} ou aux alentours ? Contactez-nous pour un devis gratuit et sans engagement.</p>`);
  return paras.join('\n');
}

// Cherche le service correspondant à la catégorie de la réalisation,
// sinon retombe sur le premier service actif.
async function resolveService(categoryId) {
  if (categoryId) {
    const [cat] = await db.select().from(categories).where(eq(categories.id, categoryId));
    if (cat?.slug) {
      const [svc] = await db.select().from(services).where(eq(services.slug, cat.slug));
      if (svc) return svc;
      // Slugs proches : « clotures » ↔ « clotures-palissades », « terrassements » ↔ « petits-terrassements »
      const [near] = await db.select().from(services).where(like(services.slug, `%${cat.slug}%`));
      if (near) return near;
    }
  }
  const [svc] = await db.select().from(services)
    .where(eq(services.active, true)).orderBy(asc(services.sortOrder));
  return svc ?? null;
}

// Appelée à chaque sauvegarde d'une réalisation publiée qui porte une ville.
// Crée un BROUILLON de page ville si elle n'existe pas — jamais d'écrasement
// d'une page déjà rédigée ou publiée.
export async function ensureCityPage(city, categoryId) {
  const name = city?.trim();
  const slug = name ? slugify(name) : '';
  if (!slug) return;
  const svc = await resolveService(categoryId);
  if (!svc?.slug) return;
  const exists = await db.select({ id: cityPages.id }).from(cityPages)
    .where(and(eq(cityPages.serviceSlug, svc.slug), eq(cityPages.slug, slug)));
  if (exists.length) return;
  const [info, geo] = await Promise.all([fetchCityInfo(name), fetchCityGeo(name)]);
  const imageUrl = info.image ? await downloadCityImage(info.image, svc.slug, slug) : null;
  const [{ id }] = await db.insert(cityPages).values({
    slug,
    city: name,
    serviceSlug: svc.slug,
    title: `${svc.title} à ${name}`,
    content: buildCityContent({ city: name, serviceTitle: svc.title, extract: info.extract, wikiUrl: info.wikiUrl, geo }),
    lat: info.lat,
    lng: info.lng,
    imageUrl,
    auto: true,
    published: false,
  }).$returningId();
  // Meta SEO pré-remplies (éditables dans le BO) — code postal = signal local fort.
  const pc = geo?.postal ? ` (${geo.postal})` : '';
  await db.insert(seoMeta).values({
    entityType: 'city_page',
    entityId: id,
    metaTitle: `${svc.title} à ${name}${pc} — Devis gratuit`,
    metaDesc: `Pépito Services réalise vos travaux de ${svc.title.toLowerCase()} à ${name}${pc} et alentours. Devis gratuit, visite technique sur place.`,
  });
  console.log(`[citygen] brouillon créé : /${svc.slug}/${slug}/`);
}
