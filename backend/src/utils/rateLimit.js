// Rate limiting en mémoire — suffisant pour un backend mono-instance.
// Fenêtre glissante par IP ; Retry-After renvoyé quand la limite est atteinte.
const buckets = new Map();

// Purge périodique des fenêtres expirées (évite la croissance mémoire).
setInterval(() => {
  const now = Date.now();
  for (const [key, b] of buckets) if (now - b.start > b.windowMs) buckets.delete(key);
}, 60_000).unref();

export function rateLimit({ windowMs = 60_000, max = 5, message = 'Trop de requêtes, réessayez dans une minute.' } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now - b.start > windowMs) {
      b = { start: now, count: 0, windowMs };
      buckets.set(key, b);
    }
    b.count++;
    if (b.count > max) {
      res.set('Retry-After', String(Math.ceil((b.start + windowMs - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
