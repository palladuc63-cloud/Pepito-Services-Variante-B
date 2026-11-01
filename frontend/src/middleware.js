import { defineMiddleware } from 'astro:middleware';
import { getRedirects } from './lib/api.js';

// Préfixe technique ignoré par le lookup de redirections
const SKIP_RE = /^\/(api|uploads|_astro|favicon)/;
const normalize = (p) => p.replace(/\/+$/, '').toLowerCase() || '/';
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  // Chemins stockés sans le préfixe de base (/test) → comparaison base-relative
  const rel = normalize(BASE && path.startsWith(BASE) ? path.slice(BASE.length) || '/' : path);
  if (!SKIP_RE.test(rel)) {
    try {
      const redirects = await getRedirects();
      const hit = redirects.find((r) => normalize(r.oldPath) === rel);
      if (hit) {
        const target = /^https?:\/\//.test(hit.newPath)
          ? hit.newPath
          : `${BASE}${hit.newPath.startsWith('/') ? '' : '/'}${hit.newPath}`;
        return context.redirect(target, hit.status === 302 ? 302 : 301);
      }
    } catch {
      // API indisponible → on laisse passer, la page rendra 404 normalement
    }
  }
  return next();
});
