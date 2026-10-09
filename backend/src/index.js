import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRouter from './routes/auth.js';
import publicRouter from './routes/public.js';
import adminRouter from './routes/admin.js';
import uploadRouter from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 3002;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET doit être défini dans .env');
  process.exit(1);
}

// Le backend n'est joignable que via Caddy (ports bind 127.0.0.1) →
// X-Forwarded-For est fiable pour le rate limiting par IP réelle.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  'https://pepito-services.fr',
  'https://www.pepito-services.fr',
  'https://pepito.agencepoint.fr',
  'http://localhost:4321',
].filter(Boolean));

// Whitelist stricte : les requêtes cross-origin non listées n'ont ni en-têtes
// CORS ni cookie exploitable (les GET same-origin sans Origin passent toujours).
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Uploads (images administrées via le back-office)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, '..', 'storage', 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`pepito-backend écoute sur le port ${PORT}`);
});
