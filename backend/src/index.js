import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRouter from './routes/auth.js';
import publicRouter from './routes/public.js';
import adminRouter from './routes/admin.js';
import uploadRouter from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 3002;

if (!process.env.SESSION_SECRET || !process.env.JWT_SECRET) {
  console.error('SESSION_SECRET et JWT_SECRET doivent être définis dans .env');
  process.exit(1);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://pepito-services.fr',
  'https://www.pepito-services.fr',
  'https://pepito.agencepoint.fr',
  'http://localhost:4321',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(null, true); // même politique permissive que les autres sites pour l'instant
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 2 * 60 * 60 * 1000,
  },
}));

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
