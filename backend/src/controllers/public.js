import { eq, asc, desc, and } from 'drizzle-orm';
import { db } from '../db.js';
import { settings, categories, services, projects, articles, messages } from '../db/schema.js';
import { notify } from '../utils/notify.js';

async function getSettingsMap() {
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

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

export async function listProjects(_req, res) {
  try {
    const rows = await db
      .select({ project: projects, category: categories })
      .from(projects)
      .leftJoin(categories, eq(projects.categoryId, categories.id))
      .where(eq(projects.published, true))
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt));
    res.json(rows.map((r) => ({ ...r.project, category: r.category })));
  } catch (err) {
    console.error('GET /public/projects:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function listArticles(_req, res) {
  try {
    const rows = await db
      .select()
      .from(articles)
      .where(eq(articles.published, true))
      .orderBy(desc(articles.publishedAt), desc(articles.createdAt));
    res.json(rows);
  } catch (err) {
    console.error('GET /public/articles:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function getArticle(req, res) {
  try {
    const [row] = await db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, req.params.slug), eq(articles.published, true)));
    if (!row) return res.status(404).json({ error: 'Article introuvable' });
    res.json(row);
  } catch (err) {
    console.error('GET /public/articles/:slug:', err.message);
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
