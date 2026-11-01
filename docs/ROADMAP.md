# Roadmap / Checklist infra

## Stockage & médias

- [ ] Migrer tous les sites hébergés sur le VPS vers **Cloudflare R2** pour les gros fichiers (photos, médias)
  - R2 : 10 Go gratuits, egress illimité gratuit (API S3 compatible)
  - Nécessite de basculer les DNS des domaines chez Cloudflare (gratuit, apporte CDN + HTTPS)
  - Prévoir `@aws-sdk/client-s3` côté backend + réécriture des URLs `/uploads/...` vers le domaine média
  - Sert aussi de sauvegarde hors-VPS des photos

## Optimisations restantes

- [ ] Optimisation automatique des images **à l'upload** dans le backend (sharp : resize 1600px + WebP q75) pour éviter la re-croissance du volume `pepito_storage`
