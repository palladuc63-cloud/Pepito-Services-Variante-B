# Pépito Services — notes projet

## Assistant SAV du back-office

Widget d'aide intégré au BO (bouton « ? » en bas à droite du dashboard
admin). Répond aux questions d'utilisation du back-office et aux infos
techniques basiques ; tout le reste part en escalade vers le prestataire.

- **Base de connaissances** : `backend/src/support/kb.js` — périmètre
  strict (pas de LLM : le matching local garantit le champ). Ajouter une
  entrée au tableau pour enrichir.
- **Matching** : `backend/src/support/matcher.js` — score par
  mots-clés/phrases, seuil avant suggestions.
- **Endpoint** : `POST /api/admin/support` (JWT admin requis, rate-limit
  30/min). `action: 'ask'` → réponse ; `action: 'escalate'` → ticket.
- **Escalation** : insère dans `messages` avec `source: 'sav'` +
  `projectType: 'SAV'` (pastille visible dans l'onglet Messages et
  Prospects) + `sendMail` vers `SUPPORT_EMAIL` (fallback `MAIL_TO`) +
  `notify` ntfy.
- **Widget** : `frontend/src/components/SupportWidget.astro`, monté dans
  `frontend/src/pages/admin/dashboard.astro`. Désactivation :
  `PUBLIC_SAV_WIDGET=0`.
- **Déploiement** : sur le VPS `/opt/pepito` —
  `git pull && docker compose -p pepito -f infra/docker-compose.production.yml --env-file .env up -d --build backend frontend`

## Posts réseaux — Facebook + fiche Google

À chaque réalisation/article publié, `queueSocialPost()`
(`backend/src/utils/social.js`) crée **deux brouillons** dans
`social_posts` — `platform: 'facebook'` et `platform: 'google'`
(texte calibré GBP via `buildGooglePostContent`, ≤1400 car., pas de
lien dans le corps). Anti-doublon par (refType, refId, platform).

- **Facebook** : publication via Graph API (`publishPost`) si
  `FB_PAGE_ID`/`FB_PAGE_ACCESS_TOKEN` configurés.
- **Fiche Google** : pas d'API (l'accès GBP demande une approbation
  Google + OAuth, pas de notion de brouillon côté API) → le BO affiche
  « Copier » + « Ouvrir la fiche » + « Marquer publié » ; la publication
  est manuelle par le client.
- **Setting `google_profile_url`** (Paramètres → « URL de la fiche
  Google ») : utilisée pour le lien footer, le bouton « Ouvrir la
  fiche » (fallback `business.google.com`) et le `sameAs` JSON-LD.
- **Maillage SEO** : entité `HomeAndConstructionBusiness` `@id
  {site}/#business` sur la homepage + pages villes, avec `sameAs` =
  URLs FB/Insta/Google (`settings.sameAs`, construit dans
  `frontend/src/lib/site.js`).
