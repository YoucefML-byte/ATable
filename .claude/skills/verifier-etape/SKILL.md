---
name: verifier-etape
description: Vérifie qu'une étape Atable respecte sa définition de « terminé » avant le compte rendu. À utiliser à la fin de chaque étape ou sous-étape.
argument-hint: "[numéro d'étape]"
---

# Vérification de l'étape $ARGUMENTS

Exécute réellement chaque vérification et note le résultat.

1. `pnpm check` — résultat complet.
2. `pnpm build`, puis les tests e2e sur la version de production (`pnpm start`, puis `E2E_NO_SERVER=1 pnpm e2e`).
3. Pour **chaque** critère d'acceptation du prompt de l'étape : le test qui le couvre (fichier et nom) ou « vérification manuelle » avec la procédure. Un critère sans preuve = étape non terminée.
4. Dans le diff de la branche (`git diff main...HEAD`) : textes d'interface en dur ; `TODO`, `FIXME`, `console.log`, `any`, `@ts-ignore`, `dangerouslySetInnerHTML` ; import du client administrateur hors des fichiers autorisés ; nouvelles dépendances ; termes interdits.
5. Liste de contrôle de sécurité (`docs/bible/05-securite-conformite.md` §14), avec une preuve par point.
6. Liste de contrôle UX (`docs/bible/07-ux-ui-design-system.md` §9) si l'interface a changé ; captures dans `docs/reports/assets/ETAPE-$ARGUMENTS/`.
7. Types de la base à jour (`pnpm db:types` ne produit aucune différence).

Résume sous forme de tableau : vérification · résultat · preuve. En cas d'échec, corrige avant le compte rendu ou explique pourquoi ce n'est pas possible.
