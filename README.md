# Pépito Services — Variante B

Maquette Astro indépendante, moderne et orientée conversion pour Pépito Services.

## Installation et commandes

```bash
npm install
npm run dev
npm run build
npm run check
```

Le serveur demandé peut être lancé avec `npm run dev -- --port 4322`.

## Choix de design

- Palette professionnelle : ardoise `#243641`, vert `#2E7D4F`, blanc, blanc cassé `#F7F8F5`, accent cuivre `#C66A3D`.
- Typographie Inter avec polices système de repli.
- Hiérarchie forte, lignes nettes, cartes sobres et appels à l’action visibles.
- Conception mobile-first, navigation accessible, lien d’évitement, focus visibles et formulaire de démonstration étiqueté.
- Données séparées des vues dans `src/data/` pour faciliter un futur back-office.

## Pages

- `/`
- `/realisations`
- `/actualites`
- `/actualites/[slug]`
- `/contact`
- `/mentions-legales`
- `/politique-confidentialite`

## Informations manquantes

Aucun téléphone, e-mail, adresse, zone d’intervention, ancienneté, certification ou avis n’a été inventé. Les contenus provisoires sont signalés « À valider ». L’URL publique `https://example.com` doit être remplacée avant mise en ligne.

## Futur back-office

Les interfaces TypeScript et les collections `settings`, `services`, `projects` et `articles` sont isolées dans `src/data`. Elles peuvent être remplacées par une API ou un CMS sans modifier les URLs publiques ni la structure principale des composants.

## Questions à traiter

- Quelles coordonnées doivent être publiées ?
- Quelle est la zone d’intervention confirmée ?
- Quels textes, catégories et détails de réalisations sont validés ?
- Quels champs et quelle destination prévoir pour le formulaire ?
- Quelle URL de production et quels comptes sociaux utiliser ?

## Validation avant publication

- Faire valider tous les libellés « À valider ».
- Remplacer l’URL de démonstration et configurer le traitement du formulaire.
- Vérifier les droits et textes alternatifs définitifs des images.
- Effectuer une recette responsive, accessibilité, SEO et confidentialité.
