# ADR-011 — Connexion de l'équipe par PIN, jeton temps réel et agents en lecture seule

- Statut : accepté
- Date : 2026-10-15
- Volumes concernés : 03 §6.2, 05 §4, 09 §7

## Connexion par PIN

1. L'appareil est reconnu par le cookie `atable_device` (`HttpOnly`, `SameSite=Strict`) ; la base ne
   stocke que son empreinte SHA-256.
2. Le PIN est vérifié avec Argon2id. Pour un membre inconnu ou verrouillé, un hachage factice est vérifié
   quand même : le temps de réponse ne révèle rien.
3. Le serveur crée la session Supabase de l'utilisateur technique de l'employé
   (`<member_id>@staff.atable.invalid`) avec `auth.admin.generateLink({ type: 'magiclink' })` puis
   `verifyOtp({ type: 'email', token_hash })`. Aucun e-mail n'est envoyé ; l'utilisateur technique n'a pas
   de mot de passe.
4. Le `session_id` du JWT est enregistré dans `staff_sessions` (14 h). La RLS exige une session employé
   valide sur un appareil non révoqué : révoquer l'appareil ou la session coupe l'accès immédiatement.

## Jeton temps réel

Les cookies de session sont `HttpOnly` : le navigateur ne peut pas lire le jeton d'accès. La route
`GET /api/realtime-token` (même origine, `no-store`) le donne au client temps réel, qui s'abonne au canal
privé `shop:<id>:orders`. La politique de `realtime.messages` vérifie l'appartenance au commerce.

## Agents de relecture

Les agents `security-reviewer`, `rls-auditor` et `ux-reviewer` sont décrits comme « lecture seule » mais la
bible leur donne l'outil `Bash`, qui permet d'écrire n'importe quel fichier. Ils n'ont plus que `Read`, `Grep`
et `Glob` ; la session principale lance les tests et leur transmet les résultats.

De même, `Bash(pnpm *)` et `Bash(npx supabase *)` autorisaient `pnpm exec …`, `pnpm dlx …` ou
`npx supabase db push` sans confirmation, contournant les règles « ask » et « deny ». `.claude/settings.json`
n'autorise plus que des scripts précis ; `pnpm exec`, `pnpm dlx` et `npx` demandent confirmation, et la
mise en production de la base par ces chemins est refusée.
