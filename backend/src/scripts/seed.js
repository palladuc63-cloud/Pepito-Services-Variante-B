import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql, eq } from 'drizzle-orm';
import { db } from '../db.js';
import { users, categories, services, projects, settings } from '../db/schema.js';
import { hashPassword } from '../utils/auth.js';
import { slugify } from '../utils/slug.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_IMG_DIR = path.join(__dirname, '..', '..', 'seed-images');
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'storage', 'uploads');

// ── Schéma (CREATE TABLE IF NOT EXISTS — compatible MariaDB) ──
const DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin') NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    summary VARCHAR(500),
    description TEXT,
    image_url VARCHAR(500),
    confirmed TINYINT(1) NOT NULL DEFAULT 0,
    provisional TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(160) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    category_id BIGINT REFERENCES categories(id),
    summary VARCHAR(500),
    description TEXT,
    image_url VARCHAR(500),
    tags JSON,
    published TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS articles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(160) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    summary VARCHAR(500),
    content TEXT,
    image_url VARCHAR(500),
    published TINYINT(1) NOT NULL DEFAULT 0,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(40),
    project_type VARCHAR(100),
    message TEXT NOT NULL,
    source VARCHAR(40) NOT NULL DEFAULT 'contact',
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    \`key\` VARCHAR(80) PRIMARY KEY,
    value TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS social_posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ref_type ENUM('project','article') NOT NULL,
    ref_id INT NOT NULL,
    platform ENUM('facebook') NOT NULL DEFAULT 'facebook',
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    link_url VARCHAR(500),
    status ENUM('draft','approved','published','failed') NOT NULL DEFAULT 'draft',
    fb_post_id VARCHAR(120),
    error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL
  )`,
];

async function ensureTables() {
  for (const stmt of DDL) await db.execute(sql.raw(stmt));
}

// Copie les images de seed vers le volume d'uploads (idempotent)
function copySeedImages() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(SEED_IMG_DIR)) return;
  for (const f of fs.readdirSync(SEED_IMG_DIR)) {
    const dest = path.join(UPLOAD_DIR, f);
    if (!fs.existsSync(dest)) fs.copyFileSync(path.join(SEED_IMG_DIR, f), dest);
  }
}

async function main() {
  await ensureTables();
  console.log('Tables OK.');
  copySeedImages();

  // 1. Admin
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('ADMIN_EMAIL et ADMIN_PASSWORD requis dans .env');
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (!existing) {
    await db.insert(users).values({ email, passwordHash: await hashPassword(password) });
    console.log(`Admin créé : ${email}`);
  } else {
    console.log('Admin déjà présent, ignoré.');
  }

  // 2. Catégories — activités réelles : clôtures / portails / petits terrassements
  const cats = [
    { slug: 'clotures', label: 'Clôtures & palissades', sortOrder: 0 },
    { slug: 'portails', label: 'Portails & portillons', sortOrder: 1 },
    { slug: 'terrassements', label: 'Petits terrassements', sortOrder: 2 },
  ];
  const catIds = {};
  for (const c of cats) {
    const [found] = await db.select().from(categories).where(eq(categories.slug, c.slug));
    if (found) { catIds[c.slug] = found.id; continue; }
    const [r] = await db.insert(categories).values(c);
    catIds[c.slug] = r.insertId;
  }
  console.log('Catégories OK.');

  // 3. Services (provisional — à valider par l'entreprise)
  const srvcs = [
    {
      slug: 'clotures-palissades',
      title: 'Clôtures & palissades',
      summary: 'Pose de clôtures rigides et palissades pour délimiter et sécuriser votre propriété.',
      description: 'Fabrication et pose de clôtures rigides, palissades et solutions d’occultation adaptées à vos besoins. Matériaux, hauteurs et finitions définis ensemble lors d’une visite sur site.',
      imageUrl: '/uploads/509217954_1158295859645962_722086975202862603_n.jpg',
      sortOrder: 0,
    },
    {
      slug: 'portails-portillons',
      title: 'Portails & portillons',
      summary: 'Portails et portillons pratiques et esthétiques pour compléter votre clôture.',
      description: 'Portails et portillons sur mesure, manuels ou équipés d’options à valider ensemble. Dimensions, sens d’ouverture et finitions précisés avec vous.',
      imageUrl: '/uploads/510103629_1162158062593075_1470665586469142132_n.jpg',
      sortOrder: 1,
    },
    {
      slug: 'petits-terrassements',
      title: 'Petits terrassements',
      summary: 'Petits travaux de terrassement pour préparer et aménager vos extérieurs.',
      description: 'Préparation de terrain, bordures, soubassements et petits terrassements associés à la pose de clôtures et d’aménagements extérieurs.',
      imageUrl: '/uploads/515879492_1171006688374879_4729343418322258480_n.jpg',
      sortOrder: 2,
    },
  ];
  for (const s of srvcs) {
    const [found] = await db.select().from(services).where(eq(services.slug, s.slug));
    if (!found) await db.insert(services).values({ ...s, confirmed: true, provisional: true });
  }
  console.log('Services OK.');

  // 4. Réalisations — migration des projets existants (catégories recalées)
  const projets = [
    { title: 'Clôture rigide — chantier résidentiel', cat: 'clotures', img: '526667199_1193094866166061_2591278162826548176_n.jpg', summary: 'Pose d’un ensemble de panneaux rigides pour clôturer un jardin.' },
    { title: 'Palissade d’occultation', cat: 'clotures', img: '526747947_1193094626166085_5444967661889720550_n.jpg', summary: 'Palissade en lames pour préserver l’intimité d’une terrasse.' },
    { title: 'Portillon d’accès', cat: 'portails', img: '548881804_1230845459057668_4375543893482562231_n.jpg', summary: 'Portillon intégré à une clôture pour un accès piéton.' },
    { title: 'Délimitation de terrain', cat: 'clotures', img: '593997222_1299146238894256_7111244287217579699_n.jpg', summary: 'Aménagement de la limite extérieure d’une propriété.' },
    { title: 'Clôture rigide — ligne de propriété', cat: 'clotures', img: '595923527_1300166818792198_3149958148292069886_n.jpg', summary: 'Ligne de clôture rigide installée en périphérie d’un terrain.' },
    { title: 'Occultation sur mesure', cat: 'clotures', img: '605111144_1313335420808671_4322054820875846881_n.jpg', summary: 'Panneau d’occultation adapté à une clôture existante.' },
    { title: 'Portillon et clôture', cat: 'portails', img: '623332063_1342261117916101_1956875220114118373_n.jpg', summary: 'Portillon associé à un ensemble de clôture.' },
    { title: 'Bordure et délimitation', cat: 'terrassements', img: '632342391_1354493173359562_2227672343321464994_n.jpg', summary: 'Pose de bordures pour structurer l’espace extérieur.' },
    { title: 'Clôture rigide avec soubassement', cat: 'clotures', img: '637782513_1360817009393845_2058624423555773206_n.jpg', summary: 'Clôture rigide complétée d’un soubassement.' },
    { title: 'Palissade décorative', cat: 'clotures', img: '638047643_1359968719478674_538155947428496695_n.jpg', summary: 'Palissade alliant occultation et esthétique.' },
  ];
  const [count] = await db.select({ n: sql`count(*)` }).from(projects);
  if (Number(count.n) === 0) {
    let order = 0;
    for (const p of projets) {
      await db.insert(projects).values({
        slug: slugify(p.title),
        title: p.title,
        categoryId: catIds[p.cat],
        summary: p.summary,
        description: 'Description provisoire — à compléter et valider avec l’entreprise.',
        imageUrl: `/uploads/${p.img}`,
        tags: ['À valider'],
        published: true,
        sortOrder: order++,
      });
    }
    console.log(`${projets.length} réalisations insérées.`);
  } else {
    console.log('Réalisations déjà présentes, ignorées.');
  }

  // 5. Settings — coordonnées en placeholder en attente du client
  const defaults = {
    site_name: 'Pépito Services',
    baseline: 'Clôtures, portails et petits terrassements sur mesure',
    description: 'Pépito Services vous accompagne dans la pose et la fabrication de clôtures, portails, palissades et petits travaux de terrassement. Demandez un chiffrage personnalisé.',
    about_text: 'Pépito Services accompagne les particuliers dans la pose et la fabrication de clôtures rigides, palissades, portails et aménagements extérieurs. Chaque projet est mené avec rigueur et un souci du détail, en privilégiant des solutions durables et esthétiques adaptées à votre terrain.',
    phone: null,
    email: null,
    address: null,
    service_area: null,
    hours: null,
    facebook_url: 'https://www.facebook.com/profile.php?id=100063966765186',
    instagram_url: null,
  };
  for (const [key, value] of Object.entries(defaults)) {
    const [found] = await db.select().from(settings).where(eq(settings.key, key));
    if (!found) await db.insert(settings).values({ key, value });
  }
  console.log('Settings OK.');

  console.log('Seed terminé.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
