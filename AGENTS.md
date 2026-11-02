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
