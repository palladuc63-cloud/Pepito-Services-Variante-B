import { eq, asc, desc, and } from 'drizzle-orm';
import { db } from '../db.js';
import {
  categories, services, projects, articles, messages, settings, socialPosts,
  projectImages, cityPages, seoMeta, redirects,
} from '../db/schema.js';
import { slugify } from '../utils/slug.js';
import { ensureCityPage, fetchCityInfo } from '../utils/citygen.js';
import { buildPostContent, postLink } from '../utils/social.js';
import { notify } from '../utils/notify.js';
import { sanitizeRichHtml } from '../utils/sanitize.js';

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
async function projectImagesMap(projectIds) {
  if (!projectIds.length) return new Map();
  const rows = await db.select().from(projectImages).orderBy(asc(projectImages.sortOrder));
  const map = new Map();
  for (const row of rows) {
    if (!projectIds.includes(row.projectId)) continue;
    if (!map.has(row.projectId)) map.set(row.projectId, []);
    map.get(row.projectId).push(row);
  }
  return map;
}

async function replaceProjectImages(projectId, images) {
  await db.delete(projectImages).where(eq(projectImages.projectId, projectId));
  const list = Array.isArray(images) ? images.filter((u) => typeof u === 'string' && u.trim()) : [];
  for (const [i, url] of list.slice(0, 10).entries()) {
    await db.insert(projectImages).values({ projectId, imageUrl: url.trim(), sortOrder: i });
  }
}

export async function listProjects(_req, res) {
  const rows = await db
    .select({ project: projects, category: categories })
    .from(projects)
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .orderBy(asc(projects.sortOrder), desc(projects.createdAt));
  const imgs = await projectImagesMap(rows.map((r) => r.project.id));
  res.json(rows.map((r) => ({ ...r.project, category: r.category, images: imgs.get(r.project.id) ?? [] })));
}

export async function createProject(req, res) {
  const { title, categoryId, summary, description, imageUrl, images, city, tags, published, publishedAt, sortOrder = 0, metaTitle, metaDesc, ogImage } = req.body ?? {};
  if (!title) return res.status(400).json({ error: 'Titre requis' });
  const slug = await uniqueSlug(projects, title);
  const cover = imageUrl ?? (Array.isArray(images) && images.length ? images[0] : null);
  const [r] = await db.insert(projects).values({
    slug, title, categoryId: categoryId || null, summary,
    description: sanitizeRichHtml(description), imageUrl: cover, city: city?.trim() || null,
    tags: Array.isArray(tags) ? tags : [], published: published !== false,
    publishedAt: publishedAt ? new Date(publishedAt) : null, sortOrder,
  }).$returningId();
  if (Array.isArray(images)) await replaceProjectImages(r.id, images);
  await upsertSeoMeta('project', r.id, { metaTitle, metaDesc, ogImage });
  if (city?.trim() && published !== false) {
    ensureCityPage(city, categoryId).catch((e) => console.error('citygen:', e.message));
  }
  if (published !== false) {
    const [cat] = categoryId ? await db.select().from(categories).where(eq(categories.id, categoryId)) : [];
    queueSocialPost('project', { id: r.id, slug, title, summary, imageUrl }, cat?.slug);
  }
  res.status(201).json({ id: r.id, slug });
}

export async function updateProject(req, res) {
  const id = Number(req.params.id);
  const { title, categoryId, summary, description, imageUrl, images, city, tags, published, publishedAt, sortOrder, metaTitle, metaDesc, ogImage } = req.body ?? {};
  const [before] = await db.select().from(projects).where(eq(projects.id, id));
  const cover = imageUrl !== undefined ? imageUrl
    : (Array.isArray(images) ? (images[0] ?? null) : undefined);
  await db.update(projects).set({
    ...(title !== undefined && { title }),
    ...(categoryId !== undefined && { categoryId: categoryId || null }),
    ...(summary !== undefined && { summary }),
    ...(description !== undefined && { description: sanitizeRichHtml(description) }),
    ...(cover !== undefined && { imageUrl: cover }),
    ...(city !== undefined && { city: city?.trim() || null }),
    ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
    ...(published !== undefined && { published }),
    ...(publishedAt !== undefined && { publishedAt: publishedAt ? new Date(publishedAt) : null }),
    ...(sortOrder !== undefined && { sortOrder }),
  }).where(eq(projects.id, id));
  if (Array.isArray(images)) await replaceProjectImages(id, images);
  if (metaTitle !== undefined || metaDesc !== undefined || ogImage !== undefined) {
    await upsertSeoMeta('project', id, { metaTitle, metaDesc, ogImage });
  }
  const nowPublished = published !== undefined ? published : before?.published;
  const finalCity = city !== undefined ? city : before?.city;
  const finalCategoryId = categoryId !== undefined ? categoryId : before?.categoryId;
  if (finalCity?.trim() && nowPublished) {
    ensureCityPage(finalCity, finalCategoryId).catch((e) => console.error('citygen:', e.message));
  }
  // Republication : brouillon FB uniquement si passage brouillon→publié
  if (before && !before.published && published === true) {
    const [cat] = categoryId ? await db.select().from(categories).where(eq(categories.id, categoryId)) : [];
    queueSocialPost('project', { id, slug: before.slug, title: title ?? before.title, summary: summary ?? before.summary, imageUrl: imageUrl ?? before.imageUrl }, cat?.slug);
  }
  res.json({ status: 'ok' });
}

export async function deleteProject(req, res) {
  const id = Number(req.params.id);
  await db.delete(projectImages).where(eq(projectImages.projectId, id));
  await db.delete(projects).where(eq(projects.id, id));
  res.json({ status: 'ok' });
}

// ─── Articles ───────────────────────────────────────────────
export const listArticles = async (_req, res) =>
  res.json(await db.select().from(articles).orderBy(desc(articles.createdAt)));

export async function createArticle(req, res) {
  const { title, summary, content, imageUrl, published = false, publishedAt, metaTitle, metaDesc, ogImage } = req.body ?? {};
  if (!title) return res.status(400).json({ error: 'Titre requis' });
  const slug = await uniqueSlug(articles, title);
  const [r] = await db.insert(articles).values({
    slug, title, summary, content: sanitizeRichHtml(content), imageUrl, published,
    publishedAt: published ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
  }).$returningId();
  await upsertSeoMeta('article', r.id, { metaTitle, metaDesc, ogImage });
  if (published) queueSocialPost('article', { id: r.id, slug, title, summary, imageUrl });
  res.status(201).json({ id: r.id, slug });
}

export async function updateArticle(req, res) {
  const id = Number(req.params.id);
  const { title, summary, content, imageUrl, published, publishedAt, metaTitle, metaDesc, ogImage } = req.body ?? {};
  const [before] = await db.select().from(articles).where(eq(articles.id, id));
  const publishNow = before && !before.published && published === true;
  await db.update(articles).set({
    ...(title !== undefined && { title }),
    ...(summary !== undefined && { summary }),
    ...(content !== undefined && { content: sanitizeRichHtml(content) }),
    ...(imageUrl !== undefined && { imageUrl }),
    ...(published !== undefined && { published }),
    ...(publishNow && { publishedAt: new Date() }),
    ...(publishedAt !== undefined && { publishedAt: publishedAt ? new Date(publishedAt) : null }),
  }).where(eq(articles.id, id));
  if (metaTitle !== undefined || metaDesc !== undefined || ogImage !== undefined) {
    await upsertSeoMeta('article', id, { metaTitle, metaDesc, ogImage });
  }
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

// ─── SEO meta (helper partagé) ──────────────────────────────
export async function upsertSeoMeta(entityType, entityId, { metaTitle, metaDesc, ogImage } = {}) {
  const rows = await db.select().from(seoMeta)
    .where(and(eq(seoMeta.entityType, entityType), eq(seoMeta.entityId, entityId)));
  const values = {
    metaTitle: metaTitle?.trim() || null,
    metaDesc: metaDesc?.trim() || null,
    ogImage: ogImage?.trim() || null,
  };
  if (rows.length) {
    await db.update(seoMeta).set(values)
      .where(and(eq(seoMeta.entityType, entityType), eq(seoMeta.entityId, entityId)));
  } else if (values.metaTitle || values.metaDesc || values.ogImage) {
    await db.insert(seoMeta).values({ entityType, entityId, ...values });
  }
}

// ─── City pages (SEO local) ─────────────────────────────────
export const listCityPages = async (_req, res) =>
  res.json(await db.select().from(cityPages).orderBy(asc(cityPages.serviceSlug), asc(cityPages.sortOrder)));

export async function createCityPage(req, res) {
  const { city, serviceSlug, title, content, imageUrl, published = false, publishedAt, sortOrder = 0, metaTitle, metaDesc, ogImage } = req.body ?? {};
  if (!city || !serviceSlug || !title) return res.status(400).json({ error: 'Ville, service et titre requis' });
  const slug = slugify(city);
  const dup = await db.select().from(cityPages)
    .where(and(eq(cityPages.serviceSlug, serviceSlug), eq(cityPages.slug, slug)));
  if (dup.length) return res.status(409).json({ error: `La page /${serviceSlug}/${slug}/ existe déjà.` });
  const geo = await fetchCityInfo(city).catch(() => ({ lat: null, lng: null }));
  const [r] = await db.insert(cityPages).values({
    slug, city, serviceSlug, title, content: sanitizeRichHtml(content), imageUrl,
    lat: geo.lat, lng: geo.lng, published,
    publishedAt: publishedAt ? new Date(publishedAt) : null, sortOrder,
  }).$returningId();
  await upsertSeoMeta('city_page', r.id, { metaTitle, metaDesc, ogImage });
  res.status(201).json({ id: r.id, slug });
}

export async function updateCityPage(req, res) {
  const id = Number(req.params.id);
  const { city, serviceSlug, title, content, imageUrl, published, publishedAt, sortOrder, metaTitle, metaDesc, ogImage } = req.body ?? {};
  // Géocodage si la page n'a pas encore de coordonnées
  const [cur] = await db.select().from(cityPages).where(eq(cityPages.id, id));
  let geo = {};
  if (cur && (cur.lat == null || cur.lng == null)) {
    const info = await fetchCityInfo(city ?? cur.city).catch(() => ({}));
    if (info.lat != null) geo = { lat: info.lat, lng: info.lng };
  }
  await db.update(cityPages).set({
    ...geo,
    ...(city !== undefined && { city, slug: slugify(city) }),
    ...(serviceSlug !== undefined && { serviceSlug }),
    ...(title !== undefined && { title }),
    ...(content !== undefined && { content: sanitizeRichHtml(content) }),
    ...(imageUrl !== undefined && { imageUrl }),
    ...(published !== undefined && { published }),
    ...(publishedAt !== undefined && { publishedAt: publishedAt ? new Date(publishedAt) : null }),
    ...(sortOrder !== undefined && { sortOrder }),
  }).where(eq(cityPages.id, id));
  if (metaTitle !== undefined || metaDesc !== undefined || ogImage !== undefined) {
    await upsertSeoMeta('city_page', id, { metaTitle, metaDesc, ogImage });
  }
  res.json({ status: 'ok' });
}

export async function deleteCityPage(req, res) {
  const id = Number(req.params.id);
  await db.delete(seoMeta).where(and(eq(seoMeta.entityType, 'city_page'), eq(seoMeta.entityId, id)));
  await db.delete(cityPages).where(eq(cityPages.id, id));
  res.json({ status: 'ok' });
}

// ─── Redirects ──────────────────────────────────────────────
export const listRedirects = async (_req, res) =>
  res.json(await db.select().from(redirects).orderBy(asc(redirects.oldPath)));

export async function createRedirect(req, res) {
  const { oldPath, newPath, status = 301 } = req.body ?? {};
  if (!oldPath || !newPath) return res.status(400).json({ error: 'Chemins requis' });
  const [r] = await db.insert(redirects).values({ oldPath, newPath, status: Number(status) || 301 }).$returningId();
  res.status(201).json({ id: r.id });
}

export async function updateRedirect(req, res) {
  const { oldPath, newPath, status } = req.body ?? {};
  await db.update(redirects).set({
    ...(oldPath !== undefined && { oldPath }),
    ...(newPath !== undefined && { newPath }),
    ...(status !== undefined && { status: Number(status) || 301 }),
  }).where(eq(redirects.id, Number(req.params.id)));
  res.json({ status: 'ok' });
}

export async function deleteRedirect(req, res) {
  await db.delete(redirects).where(eq(redirects.id, Number(req.params.id)));
  res.json({ status: 'ok' });
}

// ─── SEO meta (lecture/suppression pour l'onglet SEO) ───────
export const listSeoMeta = async (_req, res) =>
  res.json(await db.select().from(seoMeta));

export async function deleteSeoMeta(req, res) {
  await db.delete(seoMeta).where(eq(seoMeta.id, Number(req.params.id)));
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
