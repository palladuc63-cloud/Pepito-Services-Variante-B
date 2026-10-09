// Génération + publication de posts Facebook via la Graph API.
// Mode dégradé : si FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN ne sont pas configurés,
// les posts restent en brouillon et une notification ntfy est envoyée.

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
