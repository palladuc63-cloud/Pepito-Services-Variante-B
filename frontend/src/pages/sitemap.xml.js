import { getArticles, getCityPages, getProjects } from '../lib/api.js';

// Sitemap dynamique — les routes SSR ne sont pas couvertes par @astrojs/sitemap.
const STATIC_PATHS = [
  '/',
  '/a-propos/',
  '/realisations/',
  '/zones/',
  '/actualites/',
  '/contact/',
  '/mentions-legales/',
  '/politique-confidentialite/',
];

export async function GET() {
  const origin = (import.meta.env.SITE || 'https://www.pepito-services.fr').replace(/\/$/, '');
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const url = (p) => `${origin}${base}${p}`;

  const urls = [...STATIC_PATHS.map(url)];

  try {
    const [articles, cityPages, projects] = await Promise.all([getArticles(), getCityPages(), getProjects()]);
    for (const a of articles) urls.push(url(`/actualites/${a.slug}/`));
    for (const p of projects) urls.push(url(`/realisations/${p.slug}/`));
    for (const c of cityPages) urls.push(url(`/${c.serviceSlug}/${c.slug}/`));
  } catch (err) {
    console.error('sitemap:', err.message);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
