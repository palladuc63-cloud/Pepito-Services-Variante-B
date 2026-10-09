// Client API côté serveur (SSR) — appelle le backend Express.
// API_INTERNAL_URL : URL interne au réseau docker (ex: http://pepito-backend:3002)
const API = process.env.API_INTERNAL_URL || import.meta.env.API_INTERNAL_URL || 'http://localhost:3002';

const CACHE_TTL = 30_000; // 30 s — les modifs du BO sont quasi instantanées
const cache = new Map();

async function fetchJson(path, { ttl = CACHE_TTL } = {}) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.ts < ttl) return hit.data;
  const res = await fetch(`${API}${path}`);
  if (!res.ok) {
    const err = new Error(`API ${path} → ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  cache.set(path, { data, ts: Date.now() });
  return data;
}

// Contenu global : settings (clé/valeur) + catégories + services
export async function getContent() {
  return fetchJson('/api/public/content');
}

export async function getProjects() {
  return fetchJson('/api/public/projects');
}

export async function getArticles() {
  return fetchJson('/api/public/articles', { ttl: 10_000 });
}

export async function getArticle(slug) {
  try {
    return await fetchJson(`/api/public/articles/${slug}`, { ttl: 10_000 });
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}
