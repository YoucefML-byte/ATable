---
paths:
  - 'supabase/**'
  - 'src/types/database.ts'
---

# Règles base de données (s'appliquent à tout fichier de `supabase/`)

Référence complète : `docs/bible/04-base-de-donnees.md`.

- Nouvelle migration uniquement via `supabase migration new <description>` ; ne jamais modifier une migration déjà présente sur `main`.
- Toute table créée : `shop_id uuid not null` (sauf référentiels globaux), index commençant par `shop_id`, `alter table … enable row level security`, politiques explicites selon la matrice du volume 04 §6.2, tests pgTAP d'isolation — **dans la même migration et la même pull request**.
- Politiques : forme `shop_id in (select private.my_shop_ids('…'))` (lecture) et `private.my_writable_shop_ids('owner')` en `using` et `with check` (écriture). Jamais de politique pour `anon`.
- Fonctions `security definer` : `set search_path = ''`, noms entièrement qualifiés, vérification de permission en première instruction, vérification que chaque identifiant reçu appartient au commerce, erreurs métier `raise exception using errcode = 'P0001', message = 'CODE'` avec un code de `src/lib/errors.ts`.
- Une fonction qui dépend de l'heure reçoit l'instant en paramètre (ex. `private.place_order(..., p_at)`) pour être testable (ADR-009).
- Argent en `integer` (centimes) avec contrainte `>= 0`.
- Suppression logique (`deleted_at`) pour tout ce qui peut apparaître dans une commande.
- Après chaque migration : `pnpm db:reset && pnpm db:test && pnpm db:types`.
- Le seed (`supabase/seed.sql`) ne contient que des données fictives et n'est jamais appliqué ailleurs qu'en local et en recette.
