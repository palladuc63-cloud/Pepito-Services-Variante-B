// Proxy back-office → base de connaissance du chatbot Janus / assistant
// vocal POINT. Le frontend admin appelle /api/janus/knowledge (JWT requis) ;
// ici on relaie vers l'API POINT avec la clé admin du tenant
// (JANUS_TENANT_KEY), qui reste côté serveur — jamais exposée au navigateur.
import express from 'express';
import { authenticateJWT } from '../utils/auth.js';

const router = express.Router();

const JANUS_API = process.env.JANUS_API_URL || 'https://app.agencepoint.fr/api/tenant-knowledge';
const JANUS_FEATURES_API = process.env.JANUS_FEATURES_API_URL || 'https://app.agencepoint.fr/api/tenant-features';
const TENANT = process.env.JANUS_TENANT_SLUG || 'pepito-services';

async function relay(req, res, endpoint = JANUS_API) {
  const key = process.env.JANUS_TENANT_KEY || '';
  if (!key) {
    return res.status(503).json({ error: 'Assistant non configuré côté serveur.' });
  }
  try {
    const qs = new URLSearchParams({ tenant: TENANT });
    if (req.method === 'DELETE' && req.query.source) {
      qs.set('source', String(req.query.source));
    }
    const upstream = await fetch(`${endpoint}?${qs.toString()}`, {
      method: req.method,
      headers: { 'Content-Type': 'application/json', 'X-Tenant-Key': key },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
      signal: AbortSignal.timeout(90000),
    });
    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch {
    return res.status(502).json({ error: 'Service assistant momentanément indisponible.' });
  }
}

router.get('/knowledge', authenticateJWT, relay);
router.post('/knowledge', authenticateJWT, relay);
router.delete('/knowledge', authenticateJWT, relay);
// Réglages du widget (affichage chatbot / bouton rappel IA)
router.get('/features', authenticateJWT, (req, res) => relay(req, res, JANUS_FEATURES_API));
router.post('/features', authenticateJWT, (req, res) => relay(req, res, JANUS_FEATURES_API));

export default router;
