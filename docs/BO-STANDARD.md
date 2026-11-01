# BO standard artisan — blueprint `artisan-kit`

> Décision validée : **template cloné** (pas de monorepo). Un repo générique,
> un clone par client, chacun peut diverger. Partage d'améliorations par
> merge/cherry-pick depuis le template amont.

## Principe

```
artisan-kit/              repo template
├── site.config.yml       ← SEUL fichier spécifique au client
├── backend/              Express + Drizzle (schéma noyau)
├── frontend/             Astro SSR + pages génériques
└── infra/                docker-compose + Caddyfile template
```

Une instance = `git clone` + `site.config.yml` + `.env` → seed pré-remplit
catégories, services, pages villes, settings. Frontend et BO s'adaptent
automatiquement au config.

## Schéma noyau (existant Pépito ✓ / à ajouter)

| Table | Statut | Rôle |
|---|---|---|
| `users` | ✓ | Auth BO (rôle admin / rédacteur) |
| `settings` | ✓ | Clé/valeur : coordonnées, horaires, zone, réseaux, SEO global |
| `categories` | ✓ | Typologie des réalisations (par métier) |
| `services` | ✓ | Cartes services de la homepage |
| `projects` | ✓ | Réalisations |
| `project_images` | ✓ | Galerie par réalisation (couverture = sort 0) |
| `articles` | ✓ | Blog / actualités |
| `messages` | ✓ | Leads formulaire + notes internes |
| `social_posts` | ✓ | File posts Facebook auto-générés |
| `city_pages` | à ajouter | Pages SEO local « service + ville » |
| `seo_meta` | à ajouter | Meta title/desc/OG par entité |
| `redirects` | à ajouter | 301 propres à chaque migration |

### `city_pages`

```
id, slug, city, service_slug (ou category_id), title, content (HTML),
image_url, published, sort_order, created_at, updated_at
→ route générée : /<service_slug>/<ville-slug>/
```

La preuve d'efficacité : ~20 % du trafic AL-Métallerie sur ce pattern.

### `seo_meta`

```
id, entity_type ('page'|'project'|'article'|'city_page'|'service'),
entity_id, meta_title, meta_desc, og_image
→ SeoHead lit l'override, sinon fallback auto (titre + site).
```

### `redirects`

```
id, old_path, new_path, status (301|302)
→ middleware backend : lookup avant 404.
```

## Modules volontairement exclus du noyau

- **Analytics maison** (`analytics_*` AL-Métallerie : 7 tables, tracker JS,
  consentement) — lourd à maintenir ; préférer Umami/Matomo en addon.
- **CRM complet** (`prospects`, `prospect_notes`, `lead_replies`, `bookings`)
  — `messages` + notes suffisent pour un artisan seul.
- **Génération IA** (`ai_generations`) — addon ultérieur.
- **Heatmap/optins/consents** — RGPD complexe, hors noyau.

Ces modules restent des **addons optionnels** du template, activables
via `site.config.yml` (`modules: [analytics, crm]`).

## `site.config.yml` — exemple métier

```yaml
trade: cloturier                    # clé métier → seeds
business_name: "Pépito Services"
baseline: "Clôtures et portails sur mesure"
contact:
  phone: "06 ..."
  email: "contact@pepito-services.fr"
  address: "..."
  service_area: "Saint-Étienne et environs"
taxonomy:
  categories: [clotures, portails, terrassements]
  services:
    - { slug: clotures, title: "Clôtures", ... }
city_list: [saint-etienne, villefranche-sur-saone, ...]
modules: []                         # addons activés
theme: nature
```

## Frontend générique

Pages déjà présentes chez Pépito et réutilisables telles quelles :
home (hero/services/réalisations/CTA), `realisations` (+filtre),
`a-propos`, `actualites(+slug)`, `contact`, mentions légales.
À généraliser : routes `/<service>/<ville>/` rendues depuis `city_pages`,
admin city_pages, sitemap incluant les pages villes.

## Migration Pépito → noyau

1. Extraire `site.config.yml` du code actuel (~90 % du noyau déjà là)
2. Ajouter `city_pages` + `seo_meta` + `redirects` (petit diff schéma)
3. Généraliser `realisations` → routes villes
4. Le template `artisan-kit` = ce repo épuré + config externalisée
