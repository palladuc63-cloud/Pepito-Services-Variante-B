import { eq, asc, desc, and, or, isNull, isNotNull, lte } from 'drizzle-orm';
import { db } from '../db.js';
import {
  settings, categories, services, projects, articles, messages, projectImages,
  cityPages, seoMeta, redirects, slides,
} from '../db/schema.js';
import { notify } from '../utils/notify.js';
import { sendMail } from '../utils/mailer.js';
import { upsertProspect } from '../utils/prospects.js';
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
    const [settingsMap, cats, srvcs, slideRows] = await Promise.all([
      getSettingsMap(),
      db.select().from(categories).where(eq(categories.active, true)).orderBy(asc(categories.sortOrder)),
      db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.sortOrder)),
      db.select({ slide: slides, project: projects })
        .from(slides)
        .leftJoin(projects, eq(slides.projectId, projects.id))
        .where(eq(slides.active, true))
        .orderBy(asc(slides.sortOrder), asc(slides.id)),
    ]);
    // Le projet lié n'est exploité que s'il est publié (cover + lien) ;
    // sinon la slide retombe sur sa propre image, sans lien vers la réa.
    const now = new Date();
    const slidesOut = slideRows.map(({ slide, project }) => {
      const liveProject = project?.published && (!project.publishedAt || project.publishedAt <= now) ? project : null;
      return {
        ...slide,
        imageUrl: slide.imageUrl || liveProject?.imageUrl || null,
        projectSlug: liveProject?.slug || null,
        projectTitle: liveProject?.title || null,
      };
    });
    res.json({ settings: settingsMap, categories: cats, services: srvcs, slides: slidesOut });
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

// GET /api/public/city-markers — toutes les villes publiées géocodées pour la
// carte. Les pages programmées (pas encore en ligne) remontent sans url.
export async function listCityMarkers(_req, res) {
  try {
    const rows = await db
      .select({
        city: cityPages.city,
        lat: cityPages.lat,
        lng: cityPages.lng,
        serviceSlug: cityPages.serviceSlug,
        slug: cityPages.slug,
        publishedAt: cityPages.publishedAt,
      })
      .from(cityPages)
      .where(and(eq(cityPages.published, true), isNotNull(cityPages.lat), isNotNull(cityPages.lng)))
      .orderBy(asc(cityPages.city));
    const now = new Date();
    // Dédoublonnage par ville (plusieurs services possibles), lien si en ligne
    const byCity = new Map();
    for (const r of rows) {
      const url = !r.publishedAt || r.publishedAt <= now ? `/${r.serviceSlug}/${r.slug}/` : null;
      const prev = byCity.get(r.city);
      if (!prev || (!prev.url && url)) byCity.set(r.city, { lat: r.lat, lng: r.lng, city: r.city, url });
    }
    res.json([...byCity.values()]);
  } catch (err) {
    console.error('GET /public/city-markers:', err.message);
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
    const { name, email, phone, projectType, message, source, skipMail, consent } = req.body ?? {};
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
      source: ['contact', 'janus', 'voice'].includes(source) ? source : 'contact',
    });

    // Alimentation de la table prospects (dédoublonnée par email/téléphone).
    upsertProspect({
      name: name.trim(), email: email?.trim(), phone: phone?.trim(),
      projectType, source: ['contact', 'janus', 'voice'].includes(source) ? source : 'contact',
      consent,
    });

    notify(
      `📩 Nouveau message — Pépito Services`,
      `${name.trim()}${projectType ? ` (${projectType})` : ''}\n${message.trim().slice(0, 300)}`,
    );

    if (!skipMail) sendMail({
      subject: `📩 Message du site — ${name.trim()}${projectType ? ` (${projectType})` : ''}`,
      replyTo: email?.trim() || undefined,
      text: [
        `Nom : ${name.trim()}`,
        email?.trim() ? `Email : ${email.trim()}` : null,
        phone?.trim() ? `Téléphone : ${phone.trim()}` : null,
        projectType ? `Projet : ${projectType}` : null,
        '',
        message.trim(),
      ].filter((l) => l !== null).join('\n'),
    }).catch((e) => console.error('mailer:', e.message));

    res.status(201).json({ status: 'ok' });
  } catch (err) {
    console.error('POST /public/messages:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
