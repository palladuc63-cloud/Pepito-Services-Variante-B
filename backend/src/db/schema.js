import { mysqlTable, serial, varchar, text, timestamp, int, boolean, mysqlEnum, json } from 'drizzle-orm/mysql-core';

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
  tags: json('tags'),
  published: boolean('published').default(true).notNull(),
  sortOrder: int('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
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
  source: varchar('source', { length: 40 }).default('contact').notNull(), // contact | janus
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Réglages du site (clé/valeur) : coordonnées, réseaux, textes
export const settings = mysqlTable('settings', {
  key: varchar('key', { length: 80 }).primaryKey(),
  value: text('value'),
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
