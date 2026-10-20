# Pépito Services — Design system (variante B)

> Grammaire canonique partagée avec l'écosystème Point
> (voir `Point-site/docs/DESIGN-TOKENS.md`).
> Stack : Astro 7 SSR + Tailwind v4 (`@import "tailwindcss"`).

## Système de thèmes

Le site propose **5 habillages visuels** sur le même HTML et les
mêmes données. Le thème actif est posé sur
`<html data-theme="…">` :

| `data-theme` | Esprit | Mise en page |
|---|---|---|
| `nature` (défaut) | Chaleureux, arrondi, bois/terre | standard |
| `artisan` | Vert forêt, cuivre, serif, motif piquets | standard |
| `bento` | Tuiles façon app | `theme-bento.css` |
| `editorial` | Revue d'architecture, filets, sans arrondi | `theme-editorial.css` |
| `blason` | Badges pointus, logo centré, italique condensé | `theme-blason.css` |

- **Tokens** : `frontend/src/styles/tokens.css` — un bloc de
  variables CSS par thème (`[data-theme='x']`). Seule source de
  vérité pour les couleurs. Noms historiques : `--forest` = couleur
  de marque, `--copper` = accent chaud, `--basalt` = surface sombre.
- **Mise en page par thème** : `theme-*.css`, préfixés
  `:root[data-theme='x']`. Pour battre la spécificité des styles
  scopés Astro (`data-astro-cid` sur chaque sélecteur), ajouter un
  sélecteur parent (ex. `.hero-slideshow`, `.services-grid`).
- **Sélecteur** : `ThemeSwitcher.astro` (pastille en bas à gauche,
  prévue pour la phase de validation — la retirer une fois le thème
  définitif choisi). Choix mémorisé en `localStorage` et forçable
  par l'URL : `?theme=blason`.
- **Polices** : déclarées dans `frontend/astro.config.mjs`
  (`fonts:`) et injectées par `<Font>` dans `SeoHead.astro` —
  auto-hébergées, aucun appel externe. Bricolage Grotesque,
  Fraunces, Inter, Barlow Condensed (normal + italique).

## Thème par défaut (« nature »)

| Token | Valeur | Rôle |
|---|---|---|
| `--paper` / `--paper-deep` | `#fbf7f0` / `#f1e9dc` | fonds |
| `--basalt` / `--basalt-dark` | `#2c3b25` / `#1f2b1a` | surface sombre |
| `--ink` | `#3b342a` | texte |
| `--stone` / `--stone-light` | `#6a604f` / `#7a7060` | atténué |
| `--line` | `#e6dccb` | bordures |
| `--forest` | `#33603a` | marque (vert logo) |
| `--copper` | `#b5653a` | accent terre cuite |
| `--cta` | `#33603a` | bouton principal |
| `--radius` | `0.75rem` | rayon de base |
| `--font-display` / `--font-body` | Bricolage Grotesque / Inter | titres / texte |

Voir `tokens.css` pour les valeurs des autres thèmes.
