// Client API côté serveur (SSR) — appelle le backend Express.
// API_INTERNAL_URL : URL interne au réseau docker (ex: http://pepito-backend:3002)
const API = process.env.API_INTERNAL_URL || import.meta.env.API_INTERNAL_URL || 'http://localhost:3002';

const CACHE_TTL = 30_000; // 30 s — les modifs du BO sont quasi instantanées
const cache = new Map();

async function fetchJson(path, { ttl = CACHE_TTL, headers } = {}) {
  // Les appels authentifiés (preview BO) ne passent jamais par le cache partagé
  const noCache = Boolean(headers);
  const hit = cache.get(path);
  if (!noCache && hit && Date.now() - hit.ts < ttl) return hit.data;
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) {
    const err = new Error(`API ${path} → ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  if (!noCache) cache.set(path, { data, ts: Date.now() });
  return data;
}

// Contenu global : settings (clé/valeur) + catégories + services
export async function getContent() {
  return fetchJson('/api/public/content');
}

/**
 * @param {{ preview?: boolean, headers?: Record<string, string> }} [opts]
 */
export async function getProjects({ preview = false, headers } = {}) {
  return fetchJson(`/api/public/projects${preview ? '?preview=1' : ''}`, { headers });
}

/**
 * @param {string} slug
 * @param {{ preview?: boolean, headers?: Record<string, string> }} [opts]
 */
export async function getProject(slug, { preview = false, headers } = {}) {
  try {
    return await fetchJson(`/api/public/projects/${slug}${preview ? '?preview=1' : ''}`, { headers });
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function getArticles() {
  return fetchJson('/api/public/articles', { ttl: 10_000 });
}

/**
 * @param {string} slug
 * @param {{ preview?: boolean, headers?: Record<string, string> }} [opts]
 */
export async function getArticle(slug, { preview = false, headers } = {}) {
  try {
    return await fetchJson(`/api/public/articles/${slug}${preview ? '?preview=1' : ''}`, { ttl: 10_000, headers });
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

// Marqueurs de la carte des zones — villes publiées géocodées,
// url seulement quand la page est déjà en ligne
export async function getCityMarkers() {
  return fetchJson('/api/public/city-markers');
}

// Pages villes (SEO local) — /<service>/<ville>/
export async function getCityPages() {
  return fetchJson('/api/public/city-pages');
}

/**
 * @param {string} service
 * @param {string} slug
 * @param {{ preview?: boolean, headers?: Record<string, string> }} [opts]
 */
export async function getCityPage(service, slug, { preview = false, headers } = {}) {
  try {
    return await fetchJson(`/api/public/city-pages/${service}/${slug}${preview ? '?preview=1' : ''}`, { headers });
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

// Redirections — lookup pour le middleware avant 404
export async function getRedirects() {
  return fetchJson('/api/public/redirects');
}
