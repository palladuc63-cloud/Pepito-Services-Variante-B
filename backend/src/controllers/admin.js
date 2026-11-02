import { eq, asc, desc, and } from 'drizzle-orm';
import { db } from '../db.js';
import {
  categories, services, projects, articles, messages, settings,
  projectImages, cityPages, seoMeta, redirects, prospects, slides,
} from '../db/schema.js';
import { slugify } from '../utils/slug.js';
import { ensureCityPage, fetchCityInfo } from '../utils/citygen.js';
import { nextSlot, backfillDrafts } from '../utils/schedule.js';
import { queueSocialPost } from '../utils/social.js';
import { sendMail } from '../utils/mailer.js';
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

// ─── Slides (hero accueil) ───────────────────────────────────
export const listSlides = async (_req, res) => {
  const rows = await db
    .select({ slide: slides, project: projects })
    .from(slides)
    .leftJoin(projects, eq(slides.projectId, projects.id))
    .orderBy(asc(slides.sortOrder), asc(slides.id));
  res.json(rows.map(({ slide, project }) => ({
    ...slide,
    projectTitle: project?.title || null,
    projectImageUrl: project?.imageUrl || null,
  })));
};

const slideFields = (b) => ({
  title: b.title || null,
  subtitle: b.subtitle || null,
  imageUrl: b.imageUrl || null,
  projectId: b.projectId || null,
  linkUrl: b.linkUrl || null,
  linkLabel: b.linkLabel || null,
  ...(b.sortOrder !== undefined && { sortOrder: b.sortOrder }),
  ...(b.active !== undefined && { active: b.active }),
});

export async function createSlide(req, res) {
  const body = slideFields(req.body ?? {});
  if (!body.imageUrl && !body.projectId) return res.status(400).json({ error: 'Image ou réalisation liée requise' });
  const [last] = await db.select({ so: slides.sortOrder }).from(slides).orderBy(desc(slides.sortOrder)).limit(1);
  const [r] = await db.insert(slides).values({ ...body, sortOrder: (last?.so ?? -1) + 1 }).$returningId();
  res.status(201).json({ id: r.id });
}

export async function updateSlide(req, res) {
  await db.update(slides).set(slideFields(req.body ?? {})).where(eq(slides.id, Number(req.params.id)));
  res.json({ status: 'ok' });
}

export async function deleteSlide(req, res) {
  await db.delete(slides).where(eq(slides.id, Number(req.params.id)));
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
  // Auto-planification : « Publié » sans date → prochain créneau du planning.
  const autoAt = !publishedAt && published !== false ? await nextSlot('project', projects) : null;
  const [r] = await db.insert(projects).values({
    slug, title, categoryId: categoryId || null, summary,
    description: sanitizeRichHtml(description), imageUrl: cover, city: city?.trim() || null,
    tags: Array.isArray(tags) ? tags : [], published: published !== false,
    publishedAt: publishedAt ? new Date(publishedAt) : autoAt, sortOrder,
  }).$returningId();
  if (Array.isArray(images)) await replaceProjectImages(r.id, images);
  await upsertSeoMeta('project', r.id, { metaTitle, metaDesc, ogImage });
  if (city?.trim() && published !== false) {
    ensureCityPage(city, categoryId).catch((e) => console.error('citygen:', e.message));
  }
  if (published !== false && !autoAt) {
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
    // « Publier » seul (sans date) = mise en ligne immédiate : lève la programmation
    ...(published === true && publishedAt === undefined && { publishedAt: null }),
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
  const autoAt = !publishedAt && published ? await nextSlot('article', articles) : null;
  const [r] = await db.insert(articles).values({
    slug, title, summary, content: sanitizeRichHtml(content), imageUrl, published,
    publishedAt: published ? (publishedAt ? new Date(publishedAt) : (autoAt ?? new Date())) : null,
  }).$returningId();
  await upsertSeoMeta('article', r.id, { metaTitle, metaDesc, ogImage });
  if (published && !autoAt) queueSocialPost('article', { id: r.id, slug, title, summary, imageUrl });
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

// Met en file les brouillons de pages villes existants (ordre de création)
export async function scheduleCityDrafts(_req, res) {
  res.json({ scheduled: await backfillDrafts('city_page', cityPages) });
}

export async function createCityPage(req, res) {
  const { city, serviceSlug, title, content, imageUrl, published = false, publishedAt, sortOrder = 0, metaTitle, metaDesc, ogImage } = req.body ?? {};
  if (!city || !serviceSlug || !title) return res.status(400).json({ error: 'Ville, service et titre requis' });
  const slug = slugify(city);
  const dup = await db.select().from(cityPages)
    .where(and(eq(cityPages.serviceSlug, serviceSlug), eq(cityPages.slug, slug)));
  if (dup.length) return res.status(409).json({ error: `La page /${serviceSlug}/${slug}/ existe déjà.` });
  const geo = await fetchCityInfo(city).catch(() => ({ lat: null, lng: null }));
  const autoAt = !publishedAt && published ? await nextSlot('city_page', cityPages) : null;
  const [r] = await db.insert(cityPages).values({
    slug, city, serviceSlug, title, content: sanitizeRichHtml(content), imageUrl,
    lat: geo.lat, lng: geo.lng, published,
    publishedAt: publishedAt ? new Date(publishedAt) : autoAt, sortOrder,
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
    ...(published === true && publishedAt === undefined && { publishedAt: null }),
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

export async function replyToMessage(req, res) {
  const text = String(req.body?.message ?? '').trim();
  if (text.length < 2) return res.status(400).json({ error: 'Réponse vide.' });
  const [msg] = await db.select().from(messages).where(eq(messages.id, Number(req.params.id)));
  if (!msg) return res.status(404).json({ error: 'Message introuvable.' });
  if (!msg.email) return res.status(400).json({ error: 'Pas d’adresse email pour ce message.' });
  const quoted = msg.message.split('\n').map((l) => `> ${l}`).join('\n');
  const ok = await sendMail({
    to: msg.email,
    subject: 'Re: votre demande — Pépito Services',
    text: `${text}\n\n---\nLe ${new Date(msg.createdAt).toLocaleDateString('fr-FR')}, ${msg.name} écrivait :\n${quoted}`,
  });
  if (!ok) return res.status(502).json({ error: 'Envoi email impossible (SMTP).' });
  await db.update(messages).set({ repliedAt: new Date(), isRead: true })
    .where(eq(messages.id, msg.id));
  res.json({ status: 'ok' });
}

export async function deleteMessage(req, res) {
  await db.delete(messages).where(eq(messages.id, Number(req.params.id)));
  res.json({ status: 'ok' });
}

// ─── Prospects ──────────────────────────────────────────────
export const listProspects = async (_req, res) =>
  res.json(await db.select().from(prospects).orderBy(desc(prospects.lastContactAt), desc(prospects.createdAt)));

const PROSPECT_STATUSES = ['nouveau', 'contacte', 'qualifie', 'gagne', 'perdu'];

export async function updateProspect(req, res) {
  const { status, notes, consent } = req.body ?? {};
  const patch = {};
  if (status !== undefined && PROSPECT_STATUSES.includes(status)) patch.status = status;
  if (notes !== undefined) patch.notes = String(notes).slice(0, 5000);
  if (consent !== undefined) patch.consent = Boolean(consent);
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Rien à mettre à jour.' });
  await db.update(prospects).set(patch).where(eq(prospects.id, Number(req.params.id)));
  res.json({ status: 'ok' });
}

export async function deleteProspect(req, res) {
  await db.delete(prospects).where(eq(prospects.id, Number(req.params.id)));
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
