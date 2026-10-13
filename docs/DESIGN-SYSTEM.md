# Pépito Services — Design system (variante B)

> Grammaire canonique partagée avec l'écosystème Point
> (voir `Point-site/docs/DESIGN-TOKENS.md`). Palette **moderne
> froide** : vert en accent, ardoise en surface sombre.
> Stack : Astro 7 + Tailwind v4 (`@import "tailwindcss"`).

## Tokens

Déclarés dans `frontend/src/styles/tokens.css` — **seule source de
vérité**. `global.css` garde les anciens noms (`--color-primary`…) en
alias ; ne plus utiliser les anciens noms dans du nouveau code.

| Token | Valeur | Rôle |
|---|---|---|
| `--paper` | `#f7f8f5` | fond de page |
| `--basalt` / `--basalt-dark` | `#243641` / `#17272f` | surface sombre (ardoise) |
| `--ink` | `#33464f` | texte principal |
| `--stone` / `--stone-light` | `#63747c` / `#65747c` | atténué / taupe |
| `--line` | `#dbe2df` | bordures |
| `--signal` | `#2e7d4f` | accent vert |
| `--signal-dark` / `-light` / `-soft` | `#205f3a` / `#5aa877` / `#dcece2` | variantes accent |
| `--ok` / `--warn` / `--danger` (+ `-soft`) | `#2a5c38` / `#d97706` / `#dc2626` | statuts |
| `--radius` | `0.4rem` | rayon |
| `--font-display` / `--font-body` | Inter | titres & texte |

## Locaux (hors grammaire)

`--color-accent` `#c66a3d` (accent secondaire terracotta),
`--color-sand` `#e9ede8`, `--color-secondary-light` `#dfe5e8`,
`--color-info-*` (badges info).
