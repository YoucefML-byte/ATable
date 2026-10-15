# Règles de sécurité (toujours actives)

Référence complète : `docs/bible/05-securite-conformite.md`.

- Valider **toute** entrée côté serveur avec Zod (`.strict()` pour les corps d'API), même si elle l'a été côté client.
- Routes API qui modifient : refuser `GET`, vérifier l'en-tête `Origin` par rapport à l'hôte attendu, limiter la taille du corps.
- Redirections : uniquement vers des chemins internes relatifs validés (`safeRedirectPath`). Les actions serveur n'utilisent pas `redirect()` : elles renvoient `redirectTo` et le navigateur navigue (ADR-010).
- Cookies : `HttpOnly`, `Secure`, `SameSite` adapté (Strict pour l'appareil, Lax pour la table et le client), `Path=/`.
- Pages authentifiées : `Cache-Control: no-store` (posé par `src/proxy.ts`).
- Interdits : `dangerouslySetInnerHTML`, `eval`, `new Function`, `innerHTML`, SQL dynamique, `select('*')` renvoyé au navigateur.
- Ne jamais journaliser ni renvoyer : PIN, mot de passe, jeton de session, cookie, clé client, jeton de table complet (4 premiers caractères maximum), secrets.
- `import 'server-only'` dans tout fichier qui touche à l'authentification, à la clé secrète ou à des données privilégiées.
- Le client Supabase administrateur ne s'importe que depuis les fichiers listés dans `src/server/supabase/admin-usage.md` (règle ESLint `no-restricted-imports`).
- Export CSV : neutraliser les cellules commençant par `=`, `+`, `-`, `@` (`src/lib/csv.ts`).
- Toute faiblesse découverte, même hors du périmètre de l'étape, est signalée dans le compte rendu (section « Points d'attention »).
