// ─── Statistiques Umami (auto-hébergé, sans cookies) ───────
// Le backend sert de proxy : le mot de passe Umami ne quitte
// jamais le serveur. Le BO appelle /api/admin/analytics.
const UMAMI_API = (process.env.UMAMI_API_URL || '').replace(/\/$/, '');
const WEBSITE_ID = process.env.UMAMI_WEBSITE_ID || '';
const UMAMI_USER = process.env.UMAMI_USER || '';
const UMAMI_PASS = process.env.UMAMI_PASSWORD || '';
const DASHBOARD_URL = process.env.UMAMI_PUBLIC_URL || '';

let tokenCache = { token: null, at: 0 };

async function umamiToken() {
  if (tokenCache.token && Date.now() - tokenCache.at < 30 * 60e3) return tokenCache.token;
  const r = await fetch(`${UMAMI_API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: UMAMI_USER, password: UMAMI_PASS }),
  });
  if (!r.ok) throw new Error(`umami auth ${r.status}`);
  const { token } = await r.json();
  tokenCache = { token, at: Date.now() };
  return token;
}

async function umamiGet(path, retry = true) {
  const r = await fetch(`${UMAMI_API}${path}`, {
    headers: { Authorization: `Bearer ${await umamiToken()}` },
  });
  if (r.status === 401 && retry) {
    tokenCache = { token: null, at: 0 };
    return umamiGet(path, false);
  }
  if (!r.ok) throw new Error(`umami ${path} → ${r.status}`);
  return r.json();
}

export async function getAnalytics(req, res) {
  if (!UMAMI_API || !WEBSITE_ID || !UMAMI_USER || !UMAMI_PASS) {
    return res.json({ configured: false });
  }
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const end = Date.now();
  const start = end - days * 864e5;
  const q = `startAt=${start}&endAt=${end}`;
  const base = `/api/websites/${WEBSITE_ID}`;
  try {
    const [raw, topPages, referrers] = await Promise.all([
      umamiGet(`${base}/stats?${q}`),
      umamiGet(`${base}/metrics?type=path&limit=10&${q}`),
      umamiGet(`${base}/metrics?type=referrer&limit=10&${q}`),
    ]);
    const cmp = raw.comparison ?? {};
    const stats = Object.fromEntries(
      Object.entries(raw)
        .filter(([k, val]) => k !== 'comparison' && typeof val === 'number')
        .map(([k, val]) => {
          const prev = Number(cmp[k] ?? 0);
          const change = prev > 0 ? Math.round(((val - prev) / prev) * 100) : 0;
          return [k, { value: val, change }];
        }),
    );
    res.json({ configured: true, days, dashboardUrl: DASHBOARD_URL || null, stats, topPages, referrers });
  } catch (err) {
    res.status(502).json({ configured: true, error: 'Umami injoignable', detail: err.message });
  }
}
