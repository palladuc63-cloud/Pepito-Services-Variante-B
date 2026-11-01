import { eq, asc, desc, and, or, isNull, lte } from 'drizzle-orm';
import { db } from '../db.js';
import {
  settings, categories, services, projects, articles, messages, projectImages,
  cityPages, seoMeta, redirects,
} from '../db/schema.js';
import { notify } from '../utils/notify.js';
import { isAdminRequest } from '../utils/auth.js';

async function getSettingsMap() {
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// Attache les overrides SEO (entityId -> {metaTitle, metaDesc, ogImage})
async function seoMetaMap(entityType) {
  const rows = await db.select().from(seoMeta).where(eq(seoMeta.entityType, entityType));
  return new Map(rows.map((r) => [r.entityId, r]));
}
const withSeo = (map) => (row) => ({ ...row, seoMeta: map.get(row.id) ?? null });

// Publication programmée : visible si published_at absent ou déjà passé
const live = (col) => or(isNull(col), lte(col, new Date()));

// GET /api/public/content — tout ce dont le frontend a besoin pour le layout + homepage
export async function getContent(_req, res) {
  try {
    const [settingsMap, cats, srvcs] = await Promise.all([
      getSettingsMap(),
      db.select().from(categories).where(eq(categories.active, true)).orderBy(asc(categories.sortOrder)),
      db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.sortOrder)),
    ]);
    res.json({ settings: settingsMap, categories: cats, services: srvcs });
  } catch (err) {
    console.error('GET /public/content:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function listProjects(req, res) {
  try {
    // ?preview=1 + JWT admin → inclut les brouillons
    const preview = req.query.preview === '1' && isAdminRequest(req);
    const rows = await db
      .select({ project: projects, category: categories })
      .from(projects)
      .leftJoin(categories, eq(projects.categoryId, categories.id))
      .where(preview ? undefined : and(eq(projects.published, true), live(projects.publishedAt)))
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt));
    const ids = rows.map((r) => r.project.id);
    const imgs = ids.length
      ? await db.select().from(projectImages).orderBy(asc(projectImages.sortOrder))
      : [];
    const seo = await seoMetaMap('project');
    res.json(rows.map((r) => ({
      ...r.project,
      category: r.category,
      images: imgs.filter((i) => i.projectId === r.project.id),
      seoMeta: seo.get(r.project.id) ?? null,
    })));
  } catch (err) {
    console.error('GET /public/projects:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/public/projects/:slug — détail d'une réalisation
export async function getProject(req, res) {
  try {
    const preview = req.query.preview === '1' && isAdminRequest(req);
    const [row] = await db
      .select({ project: projects, category: categories })
      .from(projects)
      .leftJoin(categories, eq(projects.categoryId, categories.id))
      .where(and(
        eq(projects.slug, req.params.slug),
        ...(preview ? [] : [eq(projects.published, true), live(projects.publishedAt)]),
      ));
    if (!row) return res.status(404).json({ error: 'Réalisation introuvable' });
    const [imgs, meta] = await Promise.all([
      db.select().from(projectImages).where(eq(projectImages.projectId, row.project.id)).orderBy(asc(projectImages.sortOrder)),
      db.select().from(seoMeta).where(and(eq(seoMeta.entityType, 'project'), eq(seoMeta.entityId, row.project.id))),
    ]);
    res.json({ ...row.project, category: row.category, images: imgs, seoMeta: meta[0] ?? null });
  } catch (err) {
    console.error('GET /public/projects/:slug:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function listArticles(_req, res) {
  try {
    const rows = await db
      .select()
      .from(articles)
      .where(and(eq(articles.published, true), live(articles.publishedAt)))
      .orderBy(desc(articles.publishedAt), desc(articles.createdAt));
    const seo = await seoMetaMap('article');
    res.json(rows.map((r) => ({ ...r, seoMeta: seo.get(r.id) ?? null })));
  } catch (err) {
    console.error('GET /public/articles:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function getArticle(req, res) {
  try {
    const preview = req.query.preview === '1' && isAdminRequest(req);
    const [row] = await db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, req.params.slug), ...(preview ? [] : [eq(articles.published, true), live(articles.publishedAt)])));
    if (!row) return res.status(404).json({ error: 'Article introuvable' });
    const [meta] = await db.select().from(seoMeta)
      .where(and(eq(seoMeta.entityType, 'article'), eq(seoMeta.entityId, row.id)));
    res.json({ ...row, seoMeta: meta ?? null });
  } catch (err) {
    console.error('GET /public/articles/:slug:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ─── City pages (SEO local) ─────────────────────────────────
export async function listCityPages(_req, res) {
  try {
    const [rows, seo] = await Promise.all([
      db.select().from(cityPages).where(and(eq(cityPages.published, true), live(cityPages.publishedAt)))
        .orderBy(asc(cityPages.serviceSlug), asc(cityPages.sortOrder)),
      seoMetaMap('city_page'),
    ]);
    res.json(rows.map(withSeo(seo)));
  } catch (err) {
    console.error('GET /public/city-pages:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function getCityPage(req, res) {
  try {
    const { service, slug } = req.params;
    const preview = req.query.preview === '1' && isAdminRequest(req);
    const [row] = await db.select().from(cityPages)
      .where(and(eq(cityPages.serviceSlug, service), eq(cityPages.slug, slug), ...(preview ? [] : [eq(cityPages.published, true), live(cityPages.publishedAt)])));
    if (!row) return res.status(404).json({ error: 'Page introuvable' });
    const [meta] = await db.select().from(seoMeta)
      .where(and(eq(seoMeta.entityType, 'city_page'), eq(seoMeta.entityId, row.id)));
    res.json({ ...row, seoMeta: meta ?? null });
  } catch (err) {
    console.error('GET /public/city-pages/:service/:slug:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ─── Redirects (lookup pour le front avant 404) ─────────────
export async function listRedirects(_req, res) {
  try {
    res.json(await db.select().from(redirects));
  } catch (err) {
    console.error('GET /public/redirects:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createMessage(req, res) {
  try {
    const { name, email, phone, projectType, message, source } = req.body ?? {};
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Nom requis.' });
    }
    if (email && !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Email invalide.' });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return res.status(400).json({ error: 'Message trop court.' });
    }

    await db.insert(messages).values({
      name: name.trim().slice(0, 150),
      email: email?.trim().slice(0, 255) || null,
      phone: phone?.trim().slice(0, 40) || null,
      projectType: projectType?.slice(0, 100) || null,
      message: message.trim().slice(0, 5000),
      source: ['contact', 'janus'].includes(source) ? source : 'contact',
    });

    notify(
      `📩 Nouveau message — Pépito Services`,
      `${name.trim()}${projectType ? ` (${projectType})` : ''}\n${message.trim().slice(0, 300)}`,
    );

    res.status(201).json({ status: 'ok' });
  } catch (err) {
    console.error('POST /public/messages:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
