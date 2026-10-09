import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { users } from '../db/schema.js';
import { verifyPassword, signToken, setAuthCookie, clearAuthCookie } from '../utils/auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Email invalide.' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Mot de passe invalide.' });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    setAuthCookie(res, signToken(payload));
    req.session.userId = user.id;

    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    console.error('Erreur POST /auth/login:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export function logout(req, res) {
  clearAuthCookie(res);
  req.session?.destroy(() => {});
  res.json({ status: 'ok' });
}

export function me(req, res) {
  res.json({ id: req.user.id, email: req.user.email, role: req.user.role });
}
