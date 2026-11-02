import { mysqlTable, serial, varchar, text, timestamp, int, boolean, mysqlEnum, json, double } from 'drizzle-orm/mysql-core';

// Comptes admin du back-office
export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['admin']).default('admin').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Catégories de réalisations : clôtures / portails / terrassements…
export const categories = mysqlTable('categories', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  label: varchar('label', { length: 100 }).notNull(),
  sortOrder: int('sort_order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
});

// Services présentés sur la homepage
export const services = mysqlTable('services', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  title: varchar('title', { length: 150 }).notNull(),
  summary: varchar('summary', { length: 500 }),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  confirmed: boolean('confirmed').default(false).notNull(),
  provisional: boolean('provisional').default(true).notNull(),
  sortOrder: int('sort_order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
});

// Réalisations / chantiers
export const projects = mysqlTable('projects', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  title: varchar('title', { length: 200 }).notNull(),
  categoryId: int('category_id').references(() => categories.id),
  summary: varchar('summary', { length: 500 }),
  description: text('description'), // HTML riche
  imageUrl: varchar('image_url', { length: 500 }),
  city: varchar('city', { length: 120 }),                        // ville du chantier → génère une page ville
  tags: json('tags'),
  published: boolean('published').default(true).notNull(),
  publishedAt: timestamp('published_at'),                    // date de mise en ligne (NULL = immédiate)
  sortOrder: int('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Slides du hero de la page d'accueil. Image libre (image_url) ou
// réalisation liée (project_id → cover + lien). Champs texte optionnels :
// quand renseignés ils remplacent les textes globaux (settings).
export const slides = mysqlTable('slides', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }),           // sinon settings.site_name
  subtitle: varchar('subtitle', { length: 300 }),      // sinon settings.baseline
  imageUrl: varchar('image_url', { length: 500 }),    // prioritaire sur la cover du projet lié
  projectId: int('project_id').references(() => projects.id),
  linkUrl: varchar('link_url', { length: 500 }),      // bouton CTA custom ; sinon page du projet lié
  linkLabel: varchar('link_label', { length: 100 }),
  sortOrder: int('sort_order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Galerie photos d'une réalisation (couverture = sort_order 0)
export const projectImages = mysqlTable('project_images', {
  id: serial('id').primaryKey(),
  projectId: int('project_id').notNull().references(() => projects.id),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  alt: varchar('alt', { length: 255 }),
  sortOrder: int('sort_order').default(0).notNull(),
});

// Articles d'actualité / blog
export const articles = mysqlTable('articles', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  title: varchar('title', { length: 200 }).notNull(),
  summary: varchar('summary', { length: 500 }),
  content: text('content'), // HTML riche
  imageUrl: varchar('image_url', { length: 500 }),
  published: boolean('published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Messages du formulaire de contact / devis
export const messages = mysqlTable('messages', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 40 }),
  projectType: varchar('project_type', { length: 100 }),
  message: text('message').notNull(),
  source: varchar('source', { length: 40 }).default('contact').notNull(), // contact | janus | voice | sav
  isRead: boolean('is_read').default(false).notNull(),
  repliedAt: timestamp('replied_at'),                             // réponse envoyée depuis le BO
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Prospects : contacts dédoublonnés alimentés par tous les canaux
// (formulaire, chatbot Janus, assistant vocal). Un prospect peut
// correspondre à plusieurs messages.
export const prospects = mysqlTable('prospects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 40 }),
  source: varchar('source', { length: 40 }).default('contact').notNull(), // contact | janus | voice | manuel | sav
  projectType: varchar('project_type', { length: 100 }),
  status: varchar('status', { length: 20 }).default('nouveau').notNull(), // nouveau | contacte | qualifie | gagne | perdu
  consent: boolean('consent').default(false).notNull(),               // opt-in recontact marketing
  notes: text('notes'),                                               // suivi commercial
  lastContactAt: timestamp('last_contact_at'),                        // dernière demande reçue
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Réglages du site (clé/valeur) : coordonnées, réseaux, textes
export const settings = mysqlTable('settings', {
  key: varchar('key', { length: 80 }).primaryKey(),
  value: text('value'),
});

// Pages SEO local « service + ville » → /<service>/<ville>/
export const cityPages = mysqlTable('city_pages', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 160 }).notNull(),           // slug de la ville
  city: varchar('city', { length: 120 }).notNull(),
  serviceSlug: varchar('service_slug', { length: 80 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content'),                                    // HTML riche
  imageUrl: varchar('image_url', { length: 500 }),
  lat: double('lat'),
  lng: double('lng'),
  auto: boolean('auto').default(false).notNull(),               // générée automatiquement depuis une réalisation
  published: boolean('published').default(false).notNull(),
  publishedAt: timestamp('published_at'),                    // publication programmée (NULL = immédiate)
  sortOrder: int('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Overrides SEO par entité (fallback auto sinon)
export const seoMeta = mysqlTable('seo_meta', {
  id: serial('id').primaryKey(),
  entityType: mysqlEnum('entity_type', ['page', 'project', 'article', 'city_page', 'service']).notNull(),
  entityId: int('entity_id').notNull(),
  metaTitle: varchar('meta_title', { length: 200 }),
  metaDesc: varchar('meta_desc', { length: 300 }),
  ogImage: varchar('og_image', { length: 500 }),
});

// Redirections 301/302 (migrations, anciennes URLs)
export const redirects = mysqlTable('redirects', {
  id: serial('id').primaryKey(),
  oldPath: varchar('old_path', { length: 500 }).notNull().unique(),
  newPath: varchar('new_path', { length: 500 }).notNull(),
  status: int('status').default(301).notNull(),
});

// File de posts réseaux sociaux (Facebook d'abord)
export const socialPosts = mysqlTable('social_posts', {
  id: serial('id').primaryKey(),
  refType: mysqlEnum('ref_type', ['project', 'article']).notNull(),
  refId: int('ref_id').notNull(),
  platform: mysqlEnum('platform', ['facebook']).default('facebook').notNull(),
  content: text('content').notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  linkUrl: varchar('link_url', { length: 500 }),
  status: mysqlEnum('status', ['draft', 'approved', 'published', 'failed']).default('draft').notNull(),
  fbPostId: varchar('fb_post_id', { length: 120 }),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
});
