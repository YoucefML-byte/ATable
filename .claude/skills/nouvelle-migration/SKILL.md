---
name: nouvelle-migration
description: Procédure pour créer une migration SQL Atable avec RLS et tests pgTAP. À utiliser chaque fois qu'il faut créer ou modifier une table, une fonction, une politique ou un déclencheur dans supabase/.
argument-hint: '[description courte en anglais, ex. add_menu_schedules]'
---

# Nouvelle migration : $ARGUMENTS

1. `supabase migration new $ARGUMENTS` (ne jamais modifier une migration déjà fusionnée sur `main`).
2. Écris la migration selon `docs/bible/04-base-de-donnees.md` et `.claude/rules/database.md` : en-tête de commentaire (objectif, identifiants de la bible) ; tables avec `shop_id`, contraintes, index, RLS, politiques, privilèges de colonnes, déclencheurs `set_updated_at`, `assert_same_shop`, audit ; fonctions `security definer` seulement si nécessaire, `set search_path = ''`, permission d'abord, `revoke all … from public`, `grant execute` minimal ; rétrocompatibilité avec l'application déployée.
3. Tests dans `supabase/tests/<nn>_<sujet>.test.sql` (pgTAP) : isolation entre deux commerces ; `anon` sans accès ; permissions (patron `aal2`, patron `aal1`, employé avec et sans permission, employé sans session valide) ; règles métier et codes d'erreur.
4. `pnpm db:reset && pnpm db:test && pnpm db:types && pnpm typecheck`.
5. `pnpm db:lint` : corrige les avertissements de sécurité.
6. Note la migration dans le compte rendu de l'étape (nom, objectif, rétrocompatible oui/non).
