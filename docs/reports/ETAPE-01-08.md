# Étapes 01 à 08 — application complète

## Résumé

L'application Atable fonctionne de bout en bout en local : un client scanne le QR code de sa table,
commande sur son téléphone, la commande apparaît en moins de 3 secondes sur la tablette de la salle,
passe en cuisine, puis est servie ; la table est clôturée. Le patron gère sa carte, ses horaires, ses
tables et QR codes, son équipe, son thème et suit son activité sur un tableau de bord. La plateforme crée
les commerces et invite les patrons depuis la console. Rien n'est encore en ligne : la mise en production
(étape 9) demande d'abord les actions de `docs/HUMAN-TODO.md`.

## Ce qui a été livré

| Identifiants      | Fonction                                                                                                                                | Tests qui le prouvent                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| CLI-01 à CLI-10   | Site client : arrivée QR/NFC, carte selon l'heure, fiche produit, allergènes, panier, envoi, « Mes commandes », mentions légales, thème | `tests/e2e/customer.spec.ts`, `supabase/tests/02_orders.test.sql`, `src/features/orders/cart.test.ts`                           |
| AUTH-01 à AUTH-04 | Patron avec double authentification, appareils enrôlés, connexion de l'équipe par PIN, permissions                                      | `tests/e2e/smoke.spec.ts`, `tests/e2e/service-flow.spec.ts`, `supabase/tests/03_staff.test.sql`, `src/server/staff/pin.test.ts` |
| SAL, CUI, STK     | Salle et cuisine en temps réel, disponibilités, vue des tables, clôture                                                                 | `tests/e2e/service-flow.spec.ts` (E9, E12, E15)                                                                                 |
| CAT-01 à CAT-04   | Carte, options, allergènes, photos, cartes et horaires avec simulateur                                                                  | `tests/e2e/owner-pages.spec.ts`                                                                                                 |
| TAB-01 à TAB-03   | Tables, QR codes (SVG, PNG, planches A4), régénération, guide NFC                                                                       | `tests/e2e/owner-pages.spec.ts` (TAB-02)                                                                                        |
| REG-01, REG-02    | Réglages, thème avec aperçu et blocage du contraste                                                                                     | `tests/e2e/owner-pages.spec.ts`, `src/features/theming/theme.test.ts`                                                           |
| DSH-01, DSH-02    | Tableau de bord et alertes                                                                                                              | `tests/e2e/owner-pages.spec.ts`, `src/features/analytics/period.test.ts`, `supabase/tests/04_analytics_console.test.sql`        |
| HIS               | Historique et export CSV                                                                                                                | `src/lib/csv.test.ts`                                                                                                           |
| CON-01 à CON-06   | Console : commerces, création et invitation, domaines, facturation, assistance, journal, export                                         | `tests/e2e/console.spec.ts`, `supabase/tests/04_analytics_console.test.sql`                                                     |
| Isolation         | Aucun commerce ne voit les données d'un autre                                                                                           | `supabase/tests/01_isolation.test.sql`                                                                                          |

## Écarts par rapport à la bible

- Dossiers `int-site`, `int-pro`, `int-console` au lieu de `_site`, `(pro)`, `(console)` (ADR-010).
- Pas de shadcn/ui : des composants simples maison (`src/components/ui/primitives.tsx`) suffisent pour
  l'instant ; à remplacer si l'interface grandit.
- Formulaires de l'espace pro en état React simple, pas encore `react-hook-form` partout (le schéma Zod est
  toujours vérifié côté serveur).
- Les seize corrections de `docs/REVUE-BIBLE.md` (ADR-009, ADR-011).

## Décisions prises (ADR)

ADR-009 (corrections de la bible), ADR-010 (routage interne, rendu dynamique, navigation après les
actions), ADR-011 (connexion par PIN, jeton temps réel, agents en lecture seule).

## Tests

| Commande                                 | Résultat                        |
| ---------------------------------------- | ------------------------------- |
| `pnpm lint`                              | 0 erreur                        |
| `pnpm typecheck`                         | OK                              |
| `pnpm test`                              | 76 tests, 9 fichiers, OK        |
| `pnpm db:reset && pnpm db:test`          | 122 tests pgTAP, 4 fichiers, OK |
| `pnpm build` puis Playwright (4 projets) | 15 scénarios, OK (44 s)         |

Le délai « commande envoyée → visible en salle » mesuré par le test E12 est inférieur à 3 secondes.

## Sécurité

- RLS sur toutes les tables de `public`, isolation testée entre deux commerces.
- Prix calculés uniquement en base ; un corps de commande contenant un prix est refusé (test M2).
- Clé secrète limitée aux fichiers de `src/server/supabase/admin-usage.md`, contrôlée par ESLint.
- Aucun `dangerouslySetInnerHTML` (les QR codes sont dessinés en SVG React).
- CSP avec nonce, HSTS, `X-Frame-Options: DENY`, `no-store` sur l'espace pro et la console.
- Cookies `HttpOnly` ; PIN en Argon2id ; verrouillages progressifs ; aucun « essais restants » affiché.
- Export CSV protégé contre les formules ; export JSON sans jetons ni secrets (testé).

## Points d'attention

- **Le dépôt GitHub est public.** Le rendre privé avant d'y mettre quoi que ce soit de lié à la production.
- Les tests pgTAP supposent les données de démonstration : `pnpm db:reset` avant `pnpm db:test`.
- La sauvegarde externe (volume 08) n'est pas encore écrite ; `supabase db dump` seul n'exporte pas les
  données (`docs/REVUE-BIBLE.md` point 5).
- Le test de charge `tests/load/rush.js` est prêt mais n'a pas été lancé (il faut la recette en ligne).
- Le workflow GitHub Actions est écrit mais n'a pas encore tourné sur GitHub.

## Dette technique

- Migrer les formulaires de l'espace pro vers `react-hook-form` avec le même schéma Zod.
- Tests unitaires des actions serveur (aujourd'hui couvertes par les tests e2e et pgTAP).
- Glisser-déposer pour l'ordre des catégories et produits (aujourd'hui : flèches haut/bas).

## Actions requises du porteur de projet

Voir `docs/HUMAN-TODO.md`, en priorité : rendre le dépôt privé, créer les projets Supabase et Vercel,
créer le premier administrateur de la plateforme.

## Prochaine étape

Étape 9 — mise en production : environnement de recette, sauvegardes externes, test de charge, workflow
de déploiement, Sentry, puis premier commerce pilote.
