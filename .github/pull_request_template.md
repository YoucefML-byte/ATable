## Étape et périmètre

<!-- Étape de la roadmap (ex. 05 — Espace pro) et identifiants de la bible couverts (CLI-xx, CAT-xx…). -->

## Ce qui change pour l'utilisateur

<!-- En français simple : ce que le client, l'équipe, le patron ou la plateforme peuvent faire de nouveau. -->

## Base de données

- [ ] Aucune migration
- [ ] Migration(s) rétrocompatible(s), RLS et tests pgTAP dans la même PR

## Vérifications

- [ ] `pnpm check` (lint, types, tests unitaires, pgTAP)
- [ ] `pnpm build` puis tests e2e
- [ ] Chaque critère d'acceptation cité par un test (nom du test)
- [ ] Aucun texte d'interface en dur ; aucun secret ni jeton dans le code ou les journaux
- [ ] Client administrateur : aucun nouvel usage (ou ADR + `admin-usage.md`)
- [ ] Nouvelle dépendance justifiée (ou aucune)

## Compte rendu

<!-- Lien vers docs/reports/ETAPE-NN.md et actions ajoutées à docs/HUMAN-TODO.md. -->
