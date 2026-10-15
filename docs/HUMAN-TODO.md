# Actions du porteur de projet

Ce que Claude Code ne peut pas (ou ne doit pas) faire seul. Cochez chaque case une fois faite.

## Étapes 01 à 08 — application complète (2026-10-15)

### Version de test en ligne (recette)

- [ ] Suivre `docs/RECETTE.md` (Supabase, Vercel, paramètres GitHub, bouton « Recette — installer la base »).

### Avant la première mise en ligne

- [ ] **Rendre le dépôt GitHub privé** — il est public et contiendra la configuration de production.
      GitHub → dépôt `ATable` → Settings → General → tout en bas « Danger Zone » → _Change visibility_ →
      _Make private_.
- [ ] **Copier la bible dans `docs/bible/`** sur votre machine (le dossier est ignoré par git, la bible est
      confidentielle) pour que Claude Code puisse la relire.
- [ ] **Mettre à jour la bible** avec l'ADR-009 (`docs/adr/ADR-009-corrections-de-la-bible.md`) : volumes
      02, 04, 05 et 07.
- [ ] **Créer deux projets Supabase** (recette et production), région Europe (Paris ou Francfort), offre Pro
      pour la production (sauvegardes quotidiennes et restauration à un instant donné).
      Pour chacun : Settings → API → copier l'URL, la clé _publishable_ et la clé _secret_.
- [ ] **Configurer l'Auth de chaque projet** (Authentication → Settings) : inscriptions désactivées,
      e-mail activé, longueur minimale du mot de passe 12, TOTP activé ; _Site URL_ =
      `https://pro.<domaine>` ; _Redirect URLs_ = `https://pro.<domaine>/auth/confirm` et
      `https://console.<domaine>/auth/confirm`. Copier les modèles `supabase/templates/invite.html` et
      `recovery.html` dans Authentication → Email Templates.
- [ ] **Configurer un envoi d'e-mails** (SMTP, ex. Brevo ou Scaleway TEM) dans Authentication → SMTP :
      sans cela, Supabase limite fortement les invitations.
- [ ] **Projet Vercel** (région `cdg1`) relié au dépôt, avec les variables de `.env.example` pour la recette
      et la production. Domaines : `<domaine>`, `*.<domaine>`, `pro.<domaine>`, `console.<domaine>`.
- [ ] **Jeton API Vercel** limité au projet (Account Settings → Tokens) → variables `VERCEL_API_TOKEN`,
      `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` : la console pourra alors ajouter les domaines des commerces.
- [ ] **Premier administrateur de la plateforme** : depuis votre ordinateur, avec les variables de
      production dans `.env.local`, lancer `pnpm admin:create votre@email.fr`, ouvrir l'e-mail, choisir le
      mot de passe, puis activer la double authentification à la première connexion à la console.
- [ ] **Appliquer les migrations** à la recette puis à la production (`supabase link` puis
      `supabase db push`) — à faire vous-même ou à demander explicitement à Claude Code, jamais
      automatiquement. Ne **jamais** appliquer `supabase/seed.sql` en production.
- [ ] **Protéger la branche `main`** sur GitHub (Settings → Branches) : pull request obligatoire et
      vérification « Pull request » au vert avant fusion.

### Après la mise en ligne

- [ ] Test de charge `pnpm load` sur la **recette** (voir `tests/load/rush.js`), avant le premier commerce.
- [ ] Faire relire les mentions légales et la politique de confidentialité (pages du site client) par un
      juriste.
- [ ] Brancher Sentry (région UE) : variable `SENTRY_DSN`.
