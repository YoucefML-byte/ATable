# ADR-010 — Dossiers internes `int-*`, rendu dynamique et navigation après les actions

- Statut : accepté
- Date : 2026-10-15
- Volume concerné : 03 §4 et §5

## Contexte

La bible prévoit des dossiers `src/app/_site`, `(pro)` et `(console)`. En pratique :

- un dossier commençant par `_` est privé dans Next.js ; l'encoder en `%5F` fait fonctionner les pages mais
  casse le rechargement à chaud en développement (boucle de rechargement) ;
- la politique de sécurité du contenu (CSP) utilise un **nonce** par requête : une page générée à l'avance
  (statique, ou rendu partiel « PPR » de `cacheComponents`) ne peut pas le porter ;
- un `redirect()` dans une action serveur rend la page cible **en interne**, sans passer par `proxy.ts` :
  l'hôte n'est pas réécrit et l'utilisateur voit « Ce site n'existe pas ».

## Décisions

1. Les espaces sont dans `src/app/int-site/[host]`, `src/app/int-pro`, `src/app/int-console`. Le proxy
   réécrit l'hôte vers ces préfixes et répond 404 à tout accès direct à un préfixe interne.
2. `cacheComponents: false` ; le layout racine appelle `await connection()` : toutes les pages sont rendues
   à la demande. Les données coûteuses restent en cache (`unstable_cache` + étiquettes `host:<hôte>`,
   `menu:<shop_id>`, `tables:<shop_id>`), invalidées par `revalidateTag(tag, { expire: 0 })`.
3. Les actions serveur renvoient `{ redirectTo }` ; le navigateur navigue (`window.location.assign` ou
   `router.push`). La déconnexion est un formulaire HTML classique (`POST /api/auth/logout`).

## Conséquences

Un peu plus de calcul serveur par page (rendu dynamique), compensé par les caches de données. Les liens et
la navigation restent normaux pour l'utilisateur.
