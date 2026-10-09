import { eq, asc, desc } from 'drizzle-orm';
import { db } from '../db.js';
import {
  categories, services, projects, articles, messages, settings, socialPosts,
} from '../db/schema.js';
import { slugify } from '../utils/slug.js';
import { buildPostContent, postLink } from '../utils/social.js';
import { notify } from '../utils/notify.js';

// ─── Helpers ────────────────────────────────────────────────
async function uniqueSlug(table, base, excludeId) {
  let slug = slugify(base);
  let candidate = slug;
  let i = 2;
  while (true) {
    const rows = await db.select({ id: table.id, slug: table.slug }).from(table);
    const clash = rows.find((r) => r.slug === candidate && r.id !== excludeId);
    if (!clash) return candidate;
    candidate = `${slug}-${i++}`;
  }
}

// Crée un brouillon de post FB quand un contenu est (re)publié
async function queueSocialPost(refType, item, categorySlug) {
  try {
    const SITE = (process.env.PUBLIC_SITE_URL || 'https://pepito-services.fr').replace(/\/$/, '');
    const content = buildPostContent(refType, { ...item, categorySlug });
    await db.insert(socialPosts).values({
      refType,
      refId: item.id,
      content,
      imageUrl: item.imageUrl ? `${SITE}${item.imageUrl}` : null,
      linkUrl: postLink(refType, { ...item, categorySlug }),
      status: 'draft',
    });
    notify('📝 Post Facebook prêt — Pépito', `${item.title}\nÀ valider dans le back-office.`);
  } catch (err) {
    console.error('queueSocialPost:', err.message);
  }
}

// ─── Categories ─────────────────────────────────────────────
export const listCategories = async (_req, res) =>
  res.json(await db.select().from(categories).orderBy(asc(categories.sortOrder)));

export async function createCategory(req, res) {
  const { label, sortOrder = 0, active = true } = req.body ?? {};
  if (!label) return res.status(400).json({ error: 'Label requis' });
  const slug = await uniqueSlug(categories, label);
  const [r] = await db.insert(categories).values({ slug, label, sortOrder, active }).$returningId();
  res.status(201).json({ id: r.id, slug });
}

export async function updateCategory(req, res) {
  const { label, sortOrder, active } = req.body ?? {};
  const id = Number(req.params.id);
  await db.update(categories).set({
    ...(label !== undefined && { label }),
    ...(sortOrder !== undefined && { sortOrder }),
    ...(active !== undefined && { active }),
  }).where(eq(categories.id, id));
  res.json({ status: 'ok' });
}

export async function deleteCategory(req, res) {
  await db.delete(categories).where(eq(categories.id, Number(req.params.id)));
  res.json({ status: 'ok' });
}

// ─── Services ───────────────────────────────────────────────
export const listServices = async (_req, res) =>
  res.json(await db.select().from(services).orderBy(asc(services.sortOrder)));

export async function createService(req, res) {
  const { title, summary, description, imageUrl, confirmed, provisional, sortOrder = 0, active = true } = req.body ?? {};
  if (!title) return res.status(400).json({ error: 'Titre requis' });
  const slug = await uniqueSlug(services, title);
  const [r] = await db.insert(services).values({
    slug, title, summary, description, imageUrl, confirmed, provisional, sortOrder, active,
  }).$returningId();
  res.status(201).json({ id: r.id, slug });
}

export async function updateService(req, res) {
  const { title, summary, description, imageUrl, confirmed, provisional, sortOrder, active } = req.body ?? {};
  await db.update(services).set({
    ...(title !== undefined && { title }),
    ...(summary !== undefined && { summary }),
    ...(description !== undefined && { description }),
    ...(imageUrl !== undefined && { imageUrl }),
    ...(confirmed !== undefined && { confirmed }),
    ...(provisional !== undefined && { provisional }),
    ...(sortOrder !== undefined && { sortOrder }),
    ...(active !== undefined && { active }),
  }).where(eq(services.id, Number(req.params.id)));
  res.json({ status: 'ok' });
}

export async function deleteService(req, res) {
  await db.delete(services).where(eq(services.id, Number(req.params.id)));
  res.json({ status: 'ok' });
}

// ─── Projects ───────────────────────────────────────────────
export async function listProjects(_req, res) {
  const rows = await db
    .select({ project: projects, category: categories })
    .from(projects)
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .orderBy(asc(projects.sortOrder), desc(projects.createdAt));
  res.json(rows.map((r) => ({ ...r.project, category: r.category })));
}

export async function createProject(req, res) {
  const { title, categoryId, summary, description, imageUrl, tags, published, sortOrder = 0 } = req.body ?? {};
  if (!title) return res.status(400).json({ error: 'Titre requis' });
  const slug = await uniqueSlug(projects, title);
  const [r] = await db.insert(projects).values({
    slug, title, categoryId: categoryId || null, summary, description, imageUrl,
    tags: Array.isArray(tags) ? tags : [], published: published !== false, sortOrder,
  }).$returningId();
  if (published !== false) {
    const [cat] = categoryId ? await db.select().from(categories).where(eq(categories.id, categoryId)) : [];
    queueSocialPost('project', { id: r.id, slug, title, summary, imageUrl }, cat?.slug);
  }
  res.status(201).json({ id: r.id, slug });
}

export async function updateProject(req, res) {
  const id = Number(req.params.id);
  const { title, categoryId, summary, description, imageUrl, tags, published, sortOrder } = req.body ?? {};
  const [before] = await db.select().from(projects).where(eq(projects.id, id));
  await db.update(projects).set({
    ...(title !== undefined && { title }),
    ...(categoryId !== undefined && { categoryId: categoryId || null }),
    ...(summary !== undefined && { summary }),
    ...(description !== undefined && { description }),
    ...(imageUrl !== undefined && { imageUrl }),
    ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
    ...(published !== undefined && { published }),
    ...(sortOrder !== undefined && { sortOrder }),
  }).where(eq(projects.id, id));
  // Republication : brouillon FB uniquement si passage brouillon→publié
  if (before && !before.published && published === true) {
    const [cat] = categoryId ? await db.select().from(categories).where(eq(categories.id, categoryId)) : [];
    queueSocialPost('project', { id, slug: before.slug, title: title ?? before.title, summary: summary ?? before.summary, imageUrl: imageUrl ?? before.imageUrl }, cat?.slug);
  }
  res.json({ status: 'ok' });
}

export async function deleteProject(req, res) {
  await db.delete(projects).where(eq(projects.id, Number(req.params.id)));
  res.json({ status: 'ok' });
}

// ─── Articles ───────────────────────────────────────────────
export const listArticles = async (_req, res) =>
  res.json(await db.select().from(articles).orderBy(desc(articles.createdAt)));

export async function createArticle(req, res) {
  const { title, summary, content, imageUrl, published = false } = req.body ?? {};
  if (!title) return res.status(400).json({ error: 'Titre requis' });
  const slug = await uniqueSlug(articles, title);
  const [r] = await db.insert(articles).values({
    slug, title, summary, content, imageUrl, published,
    publishedAt: published ? new Date() : null,
  }).$returningId();
  if (published) queueSocialPost('article', { id: r.id, slug, title, summary, imageUrl });
  res.status(201).json({ id: r.id, slug });
}

export async function updateArticle(req, res) {
  const id = Number(req.params.id);
  const { title, summary, content, imageUrl, published } = req.body ?? {};
  const [before] = await db.select().from(articles).where(eq(articles.id, id));
  const publishNow = before && !before.published && published === true;
  await db.update(articles).set({
    ...(title !== undefined && { title }),
    ...(summary !== undefined && { summary }),
    ...(content !== undefined && { content }),
    ...(imageUrl !== undefined && { imageUrl }),
    ...(published !== undefined && { published }),
    ...(publishNow && { publishedAt: new Date() }),
  }).where(eq(articles.id, id));
  if (publishNow) {
    queueSocialPost('article', {
      id, slug: before.slug, title: title ?? before.title,
      summary: summary ?? before.summary, imageUrl: imageUrl ?? before.imageUrl,
    });
  }
  res.json({ status: 'ok' });
}

export async function deleteArticle(req, res) {
  await db.delete(articles).where(eq(articles.id, Number(req.params.id)));
  res.json({ status: 'ok' });
}

// ─── Messages ───────────────────────────────────────────────
export const listMessages = async (_req, res) =>
  res.json(await db.select().from(messages).orderBy(desc(messages.createdAt)));

export async function markMessageRead(req, res) {
  const { isRead } = req.body ?? {};
  await db.update(messages).set({ isRead: Boolean(isRead) })
    .where(eq(messages.id, Number(req.params.id)));
  res.json({ status: 'ok' });
}

export async function deleteMessage(req, res) {
  await db.delete(messages).where(eq(messages.id, Number(req.params.id)));
  res.json({ status: 'ok' });
}

// ─── Settings ───────────────────────────────────────────────
export async function getSettings(_req, res) {
  const rows = await db.select().from(settings);
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}

export async function updateSettings(req, res) {
  const entries = Object.entries(req.body ?? {});
  for (const [key, value] of entries) {
    if (typeof key !== 'string' || key.length > 80) continue;
    const v = value === null || value === undefined ? null : String(value);
    const [existing] = await db.select().from(settings).where(eq(settings.key, key));
    if (existing) {
      await db.update(settings).set({ value: v }).where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({ key, value: v });
    }
  }
  res.json({ status: 'ok' });
}
