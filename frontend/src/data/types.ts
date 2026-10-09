export interface SocialLink {
  name: string;
  url: string;
}

export interface NavLink {
  label: string;
  href: string;
  children?: { label: string; href: string; image?: string }[];
}

export interface SiteSettings {
  name: string;
  baseline: string;
  description: string;
  logo: string;
  /** Public URL used for SEO. Set via astro.config.mjs site value. */
  siteUrl: string;
  /** Social networks known and confirmed by the business. */
  socials: SocialLink[];
  /** Public contact placeholders — never invented. */
  contact: {
    phone: string | null;
    email: string | null;
    address: string | null;
    serviceArea: string | null;
    hours: string | null;
  };
  aboutText: string;
  nav: NavLink[];
}

export interface Category {
  id: number;
  slug: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

export interface Service {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  imageUrl: string | null;
  confirmed: boolean;
  provisional: boolean;
  sortOrder: number;
}

export interface Project {
  id: number;
  slug: string;
  title: string;
  categoryId: number | null;
  category: Category | null;
  summary: string | null;
  description: string | null;
  imageUrl: string | null;
  tags: string[];
  published: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  imageUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}
