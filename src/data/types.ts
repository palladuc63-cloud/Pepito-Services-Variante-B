import type { ImageMetadata } from 'astro';

export interface SocialLink {
  name: string;
  url: string;
}

export interface NavLink {
  label: string;
  href: string;
  children?: { label: string; href: string; image?: ImageMetadata }[];
}

export interface SiteSettings {
  name: string;
  baseline: string;
  description: string;
  logo: ImageMetadata;
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
  };
  nav: NavLink[];
}

export interface Service {
  id: string;
  title: string;
  summary: string;
  description: string;
  image: ImageMetadata;
  /** Confirmed service flag. */
  confirmed: boolean;
  /** When true, a content-validation badge is shown next to descriptions. */
  provisional: boolean;
}

export type ProjectCategory = 'clotures-rigides' | 'occultation-palissades' | 'portillons' | 'delimitation-exterieur';

export interface ProjectCategoryInfo {
  id: ProjectCategory;
  label: string;
}

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  /** Short preview text. Marked provisional by UI. */
  summary: string;
  /** Longer description for the detail view. Marked provisional by UI. */
  description: string;
  image: ImageMetadata;
  /** Technical or material tags. Provisional. */
  tags: string[];
}

export interface Article {
  slug: string;
  title: string;
  publishedAt: string;
  summary: string;
  content: string;
  image?: ImageMetadata;
}
