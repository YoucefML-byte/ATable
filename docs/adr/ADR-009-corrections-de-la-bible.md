# ADR-009 — Corrections apportées à la bible pendant l'implémentation

- Statut : accepté
- Date : 2026-10-15
- Volumes concernés : 02, 04, 05, 07

## Contexte

La relecture complète de la bible (`docs/REVUE-BIBLE.md`) a relevé des contradictions et des failles. Ces
points ont été tranchés pendant l'implémentation ; cet ADR les rassemble pour que la bible puisse être mise à
jour.

## Décisions

1. **Verrouillage d'un appareil** : un appareil verrouillé après trop d'échecs de PIN bloque uniquement les
   **nouvelles** connexions. Les sessions déjà ouvertes continuent. Sinon, un client pourrait taper de faux
   PIN sur la tablette du comptoir pour couper le service.
2. **Permission « service »** : lire les commandes demande `floor` **ou** `kitchen`
   (`private.my_shop_ids('service')`). La matrice AUTH-04 et la RLS sont désormais identiques.
3. **Jetons de table** : lisibles par le patron seulement (pas par l'équipe), pour que le QR code ne puisse
   pas être reproduit depuis une tablette.
4. **« Déjà traitée par Léa »** : `order_status_events.actor_name` garde le nom de l'auteur au moment de
   l'action, et l'erreur `INVALID_TRANSITION` porte le détail `statut|nom`. Ainsi un employé sans droit de
   lecture sur les membres voit quand même qui a traité la commande.
5. **Heure injectée** : `private.place_order(..., p_at)` reçoit l'instant ; `public_place_order` passe
   `now()`. Les tests pgTAP peuvent simuler un lundi midi ou un samedi soir.
6. **Groupe obligatoire épuisé** : un produit dont un groupe d'options obligatoire ne peut plus être
   satisfait est affiché « épuisé » et refusé à l'envoi.
7. **Idempotence** : la reprise d'une commande déjà enregistrée ne se fait que sur la contrainte
   `orders_shop_id_idempotency_key_key`, jamais sur une autre erreur d'unicité.
8. **Appareil volé, patron injoignable** : ajout de `console_revoke_device` (console de la plateforme).
9. **Annulation de « Prête » en cuisine** : le changement de statut n'est envoyé au serveur qu'à la fin des
   5 secondes d'annulation. La machine à états reste simple (pas de retour `ready → accepted`).
10. **Contraste du thème** : le texte écrit dans la couleur du commerce utilise `--brand-text`, assombrie ou
    éclaircie automatiquement jusqu'à 4,5:1 sur le fond, la surface et le fond doux. Le blocage à
    l'enregistrement ne porte que sur la couleur principale utilisée comme bouton (< 3:1 sur le fond).
11. **Erreur de PIN** : aucun « essais restants » affiché (cela aiderait un attaquant à doser ses essais).
12. **Cookie de table** : il est revérifié à chaque commande ; une table clôturée ou un jeton régénéré
    l'invalide immédiatement, sans attendre les 12 h d'expiration.

## Conséquences

Les tests pgTAP `01_isolation` à `04_analytics_console` couvrent ces points. Les volumes 02, 04, 05 et 07
devront être mis à jour par le porteur de projet (voir `docs/HUMAN-TODO.md`).
