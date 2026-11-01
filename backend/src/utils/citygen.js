// Génération automatique des pages villes (SEO local).
// Source descriptive : résumé Wikipédia FR (CC BY-SA — attribution incluse).
// Géocodage : coordonnées renvoyées par Wikipédia, fallback Nominatim.
import { eq, asc, and, like } from 'drizzle-orm';
import { db } from '../db.js';
import { cityPages, categories, services } from '../db/schema.js';
import { slugify } from './slug.js';

const UA = 'PepitoServices-SiteBuilder/1.0 (contact@pepito-services.fr)';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function fetchCityInfo(city) {
  const info = { extract: null, lat: null, lng: null, wikiUrl: null };
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

// Contenu unique par ville : extrait Wikipédia propre à la commune +
// blocs locaux (chantiers/maillage injectés dynamiquement au rendu).
function buildCityContent({ city, serviceTitle, extract, wikiUrl }) {
  const svc = esc(serviceTitle);
  const paras = [
    `<p><strong>${svc} à ${esc(city)}</strong> : Pépito Services prend en charge vos projets de ${svc.toLowerCase()} sur ${esc(city)} et ses environs. Devis gratuit, visite technique sur place avant tout chiffrage.</p>`,
  ];
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
  const info = await fetchCityInfo(name);
  await db.insert(cityPages).values({
    slug,
    city: name,
    serviceSlug: svc.slug,
    title: `${svc.title} à ${name}`,
    content: buildCityContent({ city: name, serviceTitle: svc.title, extract: info.extract, wikiUrl: info.wikiUrl }),
    lat: info.lat,
    lng: info.lng,
    auto: true,
    published: false,
  });
  console.log(`[citygen] brouillon créé : /${svc.slug}/${slug}/`);
}
