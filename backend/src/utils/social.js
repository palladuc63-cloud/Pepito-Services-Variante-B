// Génération + publication de posts Facebook via la Graph API.
// Mode dégradé : si FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN ne sont pas configurés,
// les posts restent en brouillon et une notification ntfy est envoyée.
import { eq, and, isNotNull, lte, gt } from 'drizzle-orm';
import { db } from '../db.js';
import { socialPosts, projects, articles, categories } from '../db/schema.js';
import { notify } from './notify.js';

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://pepito-services.fr').replace(/\/$/, '');
const GRAPH = 'https://graph.facebook.com/v21.0';

export function postLink(refType, item) {
  if (refType === 'article') return `${SITE_URL}/actualites/${item.slug}/`;
  return `${SITE_URL}/realisations/?categorie=${item.categorySlug ?? ''}#${item.slug}`;
}

export function buildPostContent(refType, item, siteName = 'Pépito Services') {
  const parts = [];
  parts.push(refType === 'article' ? `📰 ${item.title}` : `🚧 Nouvelle réalisation : ${item.title}`);
  if (item.summary) parts.push(item.summary);
  parts.push(`👉 ${postLink(refType, item)}`);
  parts.push(`— ${siteName}`);
  return parts.join('\n\n');
}

export function facebookConfigured() {
  return Boolean(process.env.FB_PAGE_ID && process.env.FB_PAGE_ACCESS_TOKEN);
}

// Crée un brouillon de post FB quand un contenu est (re)publié.
// Anti-doublon : un seul post par (refType, refId).
export async function queueSocialPost(refType, item, categorySlug) {
  try {
    const [dup] = await db.select({ id: socialPosts.id }).from(socialPosts)
      .where(and(eq(socialPosts.refType, refType), eq(socialPosts.refId, item.id)));
    if (dup) return;
    const content = buildPostContent(refType, { ...item, categorySlug });
    await db.insert(socialPosts).values({
      refType,
      refId: item.id,
      content,
      imageUrl: item.imageUrl ? `${SITE_URL}${item.imageUrl}` : null,
      linkUrl: postLink(refType, { ...item, categorySlug }),
      status: 'draft',
    });
    notify('📝 Post Facebook prêt — Pépito', `${item.title}\nÀ valider dans le back-office.`);
  } catch (err) {
    console.error('queueSocialPost:', err.message);
  }
}

// Les publications programmées passent en ligne par écoulement du temps —
// aucun événement API ne se déclenche. Ce balayeur détecte les contenus
// récemment passés en ligne (fenêtre 6 h) et crée leur brouillon FB.
// À appeler périodiquement (setInterval) depuis index.js.
export async function sweepDueSocialPosts() {
  const since = new Date(Date.now() - 6 * 3600e3);
  const now = new Date();
  for (const [table, refType] of [[projects, 'project'], [articles, 'article']]) {
    let due;
    try {
      due = await db.select().from(table).where(and(
        eq(table.published, true),
        isNotNull(table.publishedAt),
        lte(table.publishedAt, now),
        gt(table.publishedAt, since),
      ));
    } catch (err) {
      console.error('sweepDueSocialPosts:', err.message);
      continue;
    }
    for (const item of due) {
      let catSlug;
      if (item.categoryId) {
        const [cat] = await db.select().from(categories).where(eq(categories.id, item.categoryId));
        catSlug = cat?.slug;
      }
      await queueSocialPost(refType, item, catSlug);
    }
  }
}

// Publie sur la page Facebook. Renvoie { id } ou lève une erreur.
export async function publishToFacebook({ content, imageUrl, linkUrl }) {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) {
    throw new Error('Facebook non configuré (FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN manquants).');
  }

  const absolute = (url) => (url?.startsWith('http') ? url : `${SITE_URL}${url}`);

  // Avec image : /photos + caption ; sans image : /feed + link
  const endpoint = imageUrl ? `${GRAPH}/${pageId}/photos` : `${GRAPH}/${pageId}/feed`;
  const body = new URLSearchParams({ access_token: token });
  if (imageUrl) {
    body.set('url', absolute(imageUrl));
    body.set('caption', content);
  } else {
    body.set('message', content);
    if (linkUrl) body.set('link', absolute(linkUrl));
  }

  const res = await fetch(endpoint, { method: 'POST', body, signal: AbortSignal.timeout(15000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Graph API ${res.status}`);
  }
  return { id: data.id || data.post_id };
}
