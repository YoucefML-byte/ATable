---
name: compte-rendu
description: Rédige le compte rendu obligatoire de fin d'étape Atable (docs/reports), met à jour HUMAN-TODO et JOURNAL, prépare la pull request. À utiliser à la fin de chaque étape ou sous-étape, après verifier-etape.
argument-hint: "[numéro d'étape et nom court, ex. 03-catalogue]"
---

# Compte rendu de l'étape $ARGUMENTS

1. Crée `docs/reports/ETAPE-$ARGUMENTS.md` en suivant **exactement** `template.md` (toutes les sections, dans l'ordre ; « Rien à signaler » plutôt que de supprimer une section).
2. Écris pour un lecteur **non développeur** : phrases courtes, exemples concrets.
3. Sois **honnête** : test qui échoue, fonctionnalité partielle, raccourci, incertitude — tout va dans « Écarts » ou « Points d'attention ».
4. Ajoute à `docs/HUMAN-TODO.md` chaque action que seul le porteur de projet peut faire, sous un titre « Étape $ARGUMENTS », avec des instructions pas à pas et la raison.
5. Ajoute une ligne à `docs/JOURNAL.md` : `AAAA-MM-JJ · Étape $ARGUMENTS · <résultat en une phrase> · <lien du compte rendu>`.
6. Commit (`docs: add report for step $ARGUMENTS`), puis propose la création de la pull request (modèle `.github/pull_request_template.md` rempli) et demande l'autorisation avant de pousser.
7. Termine par le **Résumé** du compte rendu et la liste des **actions requises** du porteur de projet.
