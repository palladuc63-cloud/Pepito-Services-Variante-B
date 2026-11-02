export interface SocialLink {
  name: string;
  url: string;
}

export interface NavLink {
  label: string;
  href: string;
  icon?: string;
  children?: { label: string; href: string; image?: string; icon?: string }[];
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

export interface ProjectImage {
  id: number;
  projectId: number;
  imageUrl: string;
  alt: string | null;
  sortOrder: number;
}

export interface Slide {
  id: number;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  projectId: number | null;
  linkUrl: string | null;
  linkLabel: string | null;
  sortOrder: number;
  active: boolean;
  /** Renseignés par l'API quand la slide pointe vers une réalisation publiée. */
  projectSlug?: string | null;
  projectTitle?: string | null;
}

export interface SeoMeta {
  id: number;
  entityType: 'page' | 'project' | 'article' | 'city_page' | 'service';
  entityId: number;
  metaTitle: string | null;
  metaDesc: string | null;
  ogImage: string | null;
}

export interface CityPage {
  id: number;
  slug: string;
  city: string;
  serviceSlug: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
  auto: boolean;
  published: boolean;
  publishedAt: string | null;
  sortOrder: number;
  seoMeta: SeoMeta | null;
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
  city: string | null;
  images: ProjectImage[];
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  sortOrder: number;
  createdAt: string;
  seoMeta?: SeoMeta | null;
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
  seoMeta?: SeoMeta | null;
}
