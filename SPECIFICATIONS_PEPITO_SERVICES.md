# 📋 **Spécifications Techniques - Pépito Services**
**Version** : 1.0
**Date** : 06/09/2026
**Auteur** : [Votre Nom]
**Client** : Pépito Services
**Technos** : Astro, HTML/CSS, JavaScript, Semgrep, GitHub
**Type** : Site vitrine mobile-first

---

## 🎯 **Objectifs du projet**
- Créer un **site vitrine moderne** pour Pépito Services (spécialisé en clôtures et bois de construction).
- **Design minimaliste et épuré**, inspiré des grands acteurs comme Google ou Apple.
- **Mobile-first** : Adapté à tous les écrans (responsive).
- **Intégration de Semgrep** pour une analyse de sécurité automatique à chaque commit.
- **Déploiement simplifié** via Vercel/Netlify.

---

## 📂 **Structure du Projet**

/pepito-services/
├── .github/
│   └── workflows/
│       └── semgrep.yml          # Workflow CI/CD pour Semgrep
├── .git/
│   └── hooks/
│       └── pre-push            # Hook pour exécuter Semgrep avant chaque push
├── public/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── logo.svg        # Logo de Pépito Services (à remplacer)
│   │   │   ├── hero-bg.jpg     # Image de fond de la bannière (placeholder)
│   │   │   ├── about.jpg       # Image de la section "À propos"
│   │   │   ├── portfolio/      # Images des réalisations
│   │   │   ├── testimonials/   # Photos des témoignages clients
│   │   │   └── blog/           # Images pour les articles de blog
│   │   └── fonts/              # Polices locales (optionnel)
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Navbar.astro        # Menu de navigation
│   │   ├── Footer.astro        # Pied de page
│   │   ├── Card.astro          # Composant réutilisable (portfolio, témoignages, blog)
│   │   ├── BlogCard.astro      # Variante pour les articles de blog
│   │   └── FormContact.astro   # Formulaire de contact
│   ├── layouts/
│   │   └── MainLayout.astro    # Layout principal (header/footer)
│   ├── pages/
│   │   ├── index.astro         # Page d'accueil
│   │   ├── about.astro         # Page "À propos"
│   │   ├── portfolio.astro     # Page "Réalisations"
│   │   ├── blog/
│   │   │   ├── index.astro     # Liste des articles
│   │   │   └── [slug].astro    # Page d'un article (ex: /blog/choisir-sa-cloture)
│   │   └── contact.astro       # Page de contact
│   ├── styles/
│   │   ├── global.css          # Styles globaux
│   │   └── animations.css      # Animations (AOS/GSAP)
│   └── content/                # Contenu du blog (optionnel)
│       └── config.ts
├── .semgrep.yml                # Configuration de Semgrep
├── .env                        # Variables d'environnement (clé Google Maps)
├── astro.config.mjs            # Configuration Astro
├── package.json
├── package-lock.json
└── README.md                   # Instructions de déploiement et personnalisation

---

## 🎨 Design & Style

### Palettes de couleurs
- **Primaire** : `#4285f4` (Bleu Google)
- **Secondaire** : `#34495e` (Bleu foncé)
- **Texte** : `#333333` (Noir)
- **Fond** : `#ffffff` (Blanc)
- **Accents** : `#e74c3c` (Rouge pour les boutons CTA)

### Typographie
- **Titres** : Inter (Google Fonts)
- **Corps de texte** : Open Sans (Google Fonts)
- **Poids** :
  - Titres : 600
  - Paragraphes : 400

### Inspirations
- **Google** : Design épuré, navigation intuitive, animations fluides.
- **Apple** : Typographie claire, espacements généreux, mise en page aérée.

---

## 📱 Maquettes Mobiles & Desktop

### Page d'accueil (`/`)
- **Bannière hero** :
  - Titre : "Pépito Services"
  - Sous-titre : "Spécialiste des clôtures et bois de construction sur mesure"
  - Bouton CTA : "Demander un devis" (lien vers `/contact`).
  - Image de fond : Photo d'un chantier ou d'une clôture (placeholder : `hero-bg.jpg`).
- **Section "À propos"** :
  - Photo de l'équipe ou d'un chantier (`about.jpg`).
  - Texte court : "Depuis 2010, nous réalisons des clôtures haut de gamme pour particuliers et professionnels..."
- **Section "Nos réalisations"** :
  - Grille de 6 projets (images + titre + catégorie "Clôture" ou "Bois").
  - Exemple de projets :
    - Clôture en bois massif pour une résidence à Lyon.
    - Livraison de poutres en chêne pour un chantier.
    - Portail automatique en aluminium.
  - Bouton : "Voir toutes nos réalisations" (lien vers `/portfolio`).
- **Section "Témoignages"** :
  - 3 cartes avec :
    - Photo du client (`testimonials/client1.jpg`).
    - Nom : "Jean D."
    - Avis : "Travail soigné et équipe réactive !"
- **Section "Blog"** :
  - 3 derniers articles en liste (titre + date + extrait).
  - Exemple d'articles :
    - "Comment choisir sa clôture ?" (Guide pour sélectionner le matériau adapté).
    - "Les tendances 2026 en bois de construction".
  - Bouton : "Voir le blog" (lien vers `/blog`).
- **Carte Google Maps** :
  - Intégration d'une carte centrée sur Lyon (ou votre zone d'intervention).
  - Clé API à ajouter dans `.env` (variable `GOOGLE_MAPS_API_KEY`).

### Page "À propos" (`/about`)
- **Histoire de l'entreprise** : Texte + timeline visuelle (ex. : "Fondé en 2010", "Ouverture d'une seconde agence en 2015").
- **Équipe** : Photos + noms des membres (ex. : "Jean Dupont - Fondateur", "Marie Martin - Responsable Chantier").
- **Valeurs** : Icônes + texte (ex. : "Qualité", "Réactivité", "Écologie").

### Page "Réalisations" (`/portfolio`)
- Galerie complète avec filtres par catégorie (Clôture, Bois, Portails).
- Lightbox pour agrandir les images.
- Exemple de projets :
  - Clôture en bois massif (2023).
  - Livraison de poutres en chêne (2024).
  - Portail automatique en aluminium (2025).

### Page "Blog" (`/blog`)
- Liste d'articles avec pagination (10 articles par page).
- Structure d'un article (`[slug].astro`) :
  - Titre, date, auteur.
  - Contenu riche (texte + images).
  - Bouton "Retour au blog" (lien vers `/blog`).

### Page "Contact" (`/contact`)
- Formulaire avec champs :
  - Nom, Email, Téléphone, Message, Type de projet (menu déroulant : Clôture, Bois, Autre).
- Carte Google Maps interactive.
- Liens réseaux sociaux :
  - Facebook : https://www.facebook.com/profile.php?id=100063966765186
  - Instagram : (à ajouter si disponible)

### Pied de page (Footer)
- Liens : Accueil | À propos | Réalisations | Blog | Contact.
- Réseaux sociaux : Icônes Facebook et Instagram.
- Copyright : "© 2026 Pépito Services – Tous droits réservés".

---

## 🔧 Fonctionnalités Techniques

### 1. Animations
- **AOS (Animate On Scroll)** :
  - Effets de fondu et de défilement pour les sections.
  - Exemple : Les cartes du portfolio apparaissent quand on les atteint.
- **GSAP (optionnel)** :
  - Animations avancées (ex. : défilement fluide, transitions entre pages).

### 2. Formulaire de contact
- **Validation côté client** :
  - Champs obligatoires (Email, Message).
  - Message d'erreur si le formulaire est mal rempli.
- **Envoi côté serveur** :
  - Intégration avec un service comme Formspree ou Netlify Forms (à configurer).

### 3. Responsive Design
- **Mobile-first** :
  - Menu hamburger pour les écrans < 768px.
  - Grilles adaptatives pour les sections (portfolio, blog).
- **Breakpoints** :
  - 768px : Passage au menu mobile.
  - 1024px : Adaptation des grilles (ex. : 2 colonnes → 3 colonnes).

### 4. Sécurité (Semgrep)
- **Règles Semgrep appliquées** :
  - Détection de clés API en clair (ex. : `GOOGLE_MAPS_API_KEY`).
  - Détection de failles XSS (injections dans les formulaires).
  - Détection de mauvaises pratiques (ex. : mots de passe faibles).
- **Workflow GitHub** :
  - Analyse automatique à chaque `git push`.
  - Rapport généré dans `semgrep-report.json`.

---

## 🚀 Déploiement

### 1. Prérequis
- Node.js (v18+).
- Clé API Google Maps (optionnelle pour la carte).
- Compte GitHub et Vercel/Netlify (pour le déploiement).

### 2. Étapes de déploiement
1. Cloner le dépôt :
   ```bash
   git clone https://github.com/votre_github/pepito-services.git
   cd pepito-services
   ```
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Configurer l'environnement :
   - Créer un fichier `.env` :
     ```
     GOOGLE_MAPS_API_KEY=votre_clé_api
     FORMSPREE_ENDPOINT=votre_endpoint_formulaire
     ```
   - Remplacer les images dans `/public/assets/images/`.
4. Lancer en local :
   ```bash
   npm run dev
   ```
5. Tester Semgrep :
   ```bash
   semgrep --config=.semgrep.yml .
   ```
6. Pousser sur GitHub :
   ```bash
   git add .
   git commit -m "Initial commit: Template Astro pour Pépito Services"
   git push origin main
   ```
7. Déployer sur Vercel/Netlify :
   - Suivre les instructions de Vercel ou Netlify.

---

## 📌 Checklist pour le Client

| Tâche | Statut | Date Limite | Responsable |
| --- | --- | --- | --- |
| Valider le design (maquettes) | ❌ | 08/09/2026 | Client |
| Fournir le logo (SVG) | ❌ | 08/09/2026 | Client |
| Fournir les photos des réalisations | ❌ | 09/09/2026 | Client |
| Fournir les photos de l'équipe | ❌ | 09/09/2026 | Client |
| Valider le contenu des pages | ❌ | 10/09/2026 | Client |
| Tester le formulaire de contact | ❌ | 11/09/2026 | Développeur |
| Déploiement en production | ❌ | 12/09/2026 | Développeur |

---

## 🔄 Évolutions Possibles
- **Ajout d'un CMS** :
  - Intégrer Strapi ou Sanity pour gérer le blog facilement.
- **E-commerce** :
  - Ajouter une boutique en ligne pour vendre des kits de clôture.
- **Multilingue** :
  - Version en anglais pour cibler une clientèle internationale.
- **Dark Mode** :
  - Bouton pour basculer entre les thèmes clair et sombre.

---

## 📞 Contact & Support
- **Développeur** : [Votre Nom] (votre.email@example.com)
- **Client** : [Nom du responsable] (email.client@example.com)
- **Documentation** :
  - [Astro Docs](https://docs.astro.build)
  - [Semgrep Docs](https://semgrep.dev/docs)

---

## 🎨 Exemples de Sites Web à Présenter au Client

Pour convaincre votre client, voici **3 exemples de sites web inspirants** (maquettes visuelles) que vous pouvez générer avec des outils comme **Figma**, **Adobe XD**, ou même **des templates Astro existants**.

### 1. Exemple 1 : Site Minimaliste (Style Google/Apple)
**Inspiration** : Design épuré, typographie claire, animations subtiles.
**Template Astro compatible** :
- [Astro Paper](https://github.com/satnaing/astro-paper) (minimaliste, blog-friendly).
- [Astro Stellar](https://github.com/codewithsadee/astro-stellar) (portfolio/entreprise).

**Maquette visuelle (simulée)** :
- **Homepage** :
  - Bannière hero avec titre et bouton CTA.
  - Sections "À propos", "Réalisations", "Témoignages" en grille.
  - Footer avec liens sociaux.
- **Page "Contact"** :
  - Formulaire avec champs obligatoires.
  - Carte Google Maps intégrée.

### 2. Exemple 2 : Site avec Portfolio Visuel
**Inspiration** : Galerie d'images en priorité, design aéré.
**Template Astro compatible** :
- [Astrofolio](https://github.com/Yan-Perso/astrofolio) (portfolio professionnel).
- [Astro Lumos](https://github.com/onwidget/astrolab) (moderne et visuel).

**Maquette visuelle (simulée)** :
- **Page "Réalisations"** :
  - Grille de projets avec images en plein écran.
  - Filtres par catégorie (Clôture, Bois, etc.).
  - Lightbox pour agrandir les images.
- **Page "À propos"** :
  - Timeline visuelle de l'entreprise.
  - Photos de l'équipe.

### 3. Exemple 3 : Site avec Blog et SEO Optimisé
**Inspiration** : Contenu riche, articles de blog, intégration SEO.
**Template Astro compatible** :
- [Astro Starter Blog](https://github.com/withastro/astro/tree/main/examples/blog) (officiel Astro).
- [Astro Markdown Blog](https://github.com/markteekman/astro-markdown-blog).

**Maquette visuelle (simulée)** :
- **Page "Blog"** :
  - Liste d'articles avec pagination.
  - Images d'illustration pour chaque article.
  - Bouton "Lire la suite".
- **Article de blog** :
  - Contenu structuré avec images.
  - Boutons de partage (Facebook, LinkedIn).

### 🔗 Ressources pour Générer ces Exemples
1. **Figma/Adobe XD** :
   - Utilisez les templates ci-dessus comme base.
2. **Astro + Templates** :
   - Installez un template et personnalisez-le avec les couleurs et le contenu de Pépito Services.
   - Exemple de commande :
     ```bash
     npx degit satnaing/astro-paper pepito-services-exemple
     cd pepito-services-exemple
     npm install
     npm run dev
     ```
3. **Outils de Mockup** :
   - [Canva](https://www.canva.com/) : Créez des maquettes rapides.
   - [MockFlow](https://www.mockflow.com/) : Pour les wireframes.

---

## 📌 Prochaine Étape
1. **Sauvegardez le fichier `SPECIFICATIONS_PEPITO_SERVICES.md`** dans votre projet.
2. **Choisissez un exemple** parmi les 3 proposés (ou demandez-moi d'en générer d'autres).
3. **Je peux générer des maquettes plus détaillées** (en HTML/CSS ou Figma) si besoin.
