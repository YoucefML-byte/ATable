# Atable

Plateforme **multi-commerces** de commande à table par QR code ou puce NFC (restaurants, bars, chichas,
cafés…). Un seul code et une seule base servent tous les commerces ; chaque commerce a son domaine, son
thème et ses données isolées. Le client commande sans compte, l'équipe valide chaque commande, la cuisine
prépare, le paiement se fait au comptoir (aucun paiement en ligne).

« Atable » est un nom de travail. La bible du projet (10 volumes) est **confidentielle** et n'est pas
versionnée : copiez-la dans `docs/bible/` sur votre machine (dossier ignoré par git).

## Les quatre espaces

| Espace      | Adresse locale                                                  | Pour qui                                                                                                    |
| ----------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Site client | `http://bistrot.localhost:3000`, `http://lounge.localhost:3000` | Les clients, depuis le QR code de leur table                                                                |
| Espace pro  | `http://pro.localhost:3000`                                     | Le patron (e-mail + mot de passe + double authentification) et l'équipe (code PIN sur une tablette enrôlée) |
| Console     | `http://console.localhost:3000`                                 | L'équipe de la plateforme (création des commerces, domaines, facturation)                                   |

En production : `<commerce>.atable.fr` ou le domaine du commerce, `pro.atable.fr`, `console.atable.fr`.

## Démarrer en local

Prérequis : Node.js 22, pnpm 10, Docker.

```bash
pnpm install
pnpm db:start            # Supabase local (base, Auth, Realtime, Storage, e-mails de test)
cp .env.example .env.local
# Compléter .env.local avec les clés affichées par : pnpm exec supabase status
pnpm db:reset            # schéma + données de démonstration
pnpm dev                 # http://pro.localhost:3000
```

Les e-mails (invitations, mots de passe oubliés) arrivent dans Mailpit : http://127.0.0.1:54324.

### Comptes de démonstration (local uniquement)

| Rôle               | Identifiant          | Mot de passe         | Double authentification     |
| ------------------ | -------------------- | -------------------- | --------------------------- |
| Plateforme         | `admin@atable.test`  | `Console-Demo-2026!` | clé TOTP `JBSWY3DPEHPK3PXP` |
| Patron du Bistrot  | `karim@bistrot.test` | `Bistrot-Demo-2026!` | clé TOTP `KRSXG5CTMVRXEZLU` |
| Patronne du Lounge | `samia@lounge.test`  | `Lounge-Demo-2026!`  | clé TOTP `GEZDGNBVGY3TQOJQ` |

Ajoutez la clé TOTP dans une application d'authentification (Google Authenticator, 2FAS…) pour obtenir
les codes à 6 chiffres.

Équipe du Bistrot (codes PIN, sur une tablette enrôlée depuis « Appareils ») : Léa `241608` (salle,
disponibilités), Mehdi `739215` (cuisine), Sofia `518374` (tout). Lounge : Inès `362951`, Yanis
`847120`, Nora `905263`.

QR codes de démonstration : `pnpm demo:qr` écrit les images dans `.demo-qr/` et affiche les liens
(ex. `http://bistrot.localhost:3000/t/demoBistrotTable000001`).

## Commandes

| Commande                                                   | Rôle                                                                         |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`                                                 | Serveur de développement                                                     |
| `pnpm check`                                               | Lint, types, tests unitaires et tests de la base (pgTAP)                     |
| `pnpm db:reset` / `pnpm db:test` / `pnpm db:types`         | Base locale : remise à zéro, tests, types TypeScript                         |
| `pnpm build && pnpm start` puis `E2E_NO_SERVER=1 pnpm e2e` | Tests de bout en bout (Playwright) sur la version de production              |
| `pnpm admin:create <email>`                                | Créer un administrateur de la plateforme (invitation par e-mail)             |
| `pnpm load`                                                | Test de charge k6, **sur la recette uniquement** (voir `tests/load/rush.js`) |

Les tests pgTAP supposent les données de démonstration : lancez `pnpm db:reset` avant `pnpm db:test` si
vous avez manipulé la base à la main.

## Ce qui est en place

- **Site client** : arrivée par QR ou NFC, carte selon l'heure (cartes et plages horaires), fiche produit
  avec options et allergènes, panier, envoi avec confirmation, « Mes commandes », mentions légales, thème du
  commerce (couleurs, polices, mise en page, mode sombre).
- **Espace pro** : connexion du patron avec double authentification, appareils enrôlés et connexion de
  l'équipe par PIN, écran Salle (validation, refus, servie) et Cuisine (minuteurs, « Prête » annulable 5 s)
  en temps réel, vue des tables et clôture, disponibilités en direct, historique et export CSV, équipe,
  carte (catégories, produits, options, allergènes, photos), cartes et horaires avec simulateur, tables et
  QR codes (planches A4, NFC), réglages, thème avec contrôle du contraste, tableau de bord.
- **Console** : liste et santé des commerces, anomalies, création avec invitation du patron, statuts,
  domaines personnalisés (API Vercel), facturation interne, réinitialisation de la double authentification,
  journal, export JSON et CSV.
- **Base de données** : 17 migrations, RLS sur toutes les tables, fonctions métier en base (prix calculés
  par la base uniquement), 122 tests pgTAP.
- **Tests** : 80+ tests unitaires, 15 scénarios de bout en bout (téléphones, tablette, ordinateur),
  vérification d'accessibilité axe sur le parcours client.

## Documentation

- `CLAUDE.md` : instructions permanentes pour Claude Code (règles non négociables).
- `docs/REVUE-BIBLE.md` : relecture de la bible et corrections appliquées.
- `docs/adr/` : décisions prises pendant l'implémentation (ADR-009 à 011).
- `docs/HUMAN-TODO.md` : ce que seul le porteur de projet peut faire (comptes, domaines, secrets).
- `docs/JOURNAL.md` : historique des étapes.
- `src/server/supabase/admin-usage.md` : usages autorisés de la clé secrète.
