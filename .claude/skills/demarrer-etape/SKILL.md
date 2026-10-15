---
name: demarrer-etape
description: Démarre une étape de la roadmap Atable (lecture du contexte, branche, plan). À utiliser au début de chaque étape ou sous-étape, avec le numéro d'étape en argument.
argument-hint: "[numéro d'étape, ex. 03]"
disable-model-invocation: true
---

# Démarrer l'étape $ARGUMENTS

1. **Contexte** — Lis, dans cet ordre : `CLAUDE.md` ; le prompt de l'étape (`prompts/ETAPE-$ARGUMENTS-*.md`) ; les volumes de la bible cités ; `docs/PLAN.md` ; le dernier compte rendu de `docs/reports/` (« Points d'attention », « Dette technique », « Prochaine étape ») ; `docs/HUMAN-TODO.md` ; les ADR récents de `docs/adr/`.
2. **État du dépôt** — `git status`, `git log --oneline -10`, branche courante. S'il existe des modifications non commitées, arrête-toi et demande quoi en faire.
3. **Santé** — `pnpm db:start` si nécessaire, puis `pnpm check`. Si quelque chose échoue avant même de commencer, signale-le et propose de le corriger d'abord.
4. **Branche** — crée la branche `etape-$ARGUMENTS-<nom-court>` depuis `main` à jour.
5. **Plan** — en français : ce que je vais livrer (5 lignes maximum) ; fichiers et migrations ; ordre des sous-tâches avec leurs identifiants et leurs tests ; décisions à prendre (avec recommandation) ; besoins du porteur de projet ; risques.
6. **Attends l'accord** du porteur de projet avant toute modification de fichier.
