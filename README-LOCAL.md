# Lancer Simulation Basketball

## Méthode recommandée (Node.js)

1. Installer **Node.js 18 ou plus récent**.
2. Ouvrir un terminal dans le dossier du projet.
3. Exécuter `npm start`.
4. Ouvrir **http://127.0.0.1:3001**.

Le serveur Node sert le jeu et fournit le relais local utilisé par « Synchroniser ratings ». Aucune dépendance npm supplémentaire n'est nécessaire.

## Avec Live Server

Tu peux aussi conserver Live Server sur le port 5500. L’extension Chrome communique directement avec l’onglet 2KRatings ; Node n’est pas requis pour lire les notes ni pour tenter de récupérer la photo. `npm start` reste utile si tu veux servir le jeu localement ou garder le relais d’image comme solution de secours.

Le relais local évite les restrictions CORS du navigateur. Il ne peut toutefois pas contourner un éventuel blocage, CAPTCHA ou refus HTTP imposé directement par 2KRatings.

## Installer l’extension Chrome pour synchroniser 2KRatings

La synchronisation automatique utilise une petite extension Chrome : elle ouvre la fiche du joueur dans un onglet 2KRatings et transmet le HTML de cette page au simulateur. Cela évite que le serveur Node tente lui-même de télécharger la page et reçoive un HTTP 403.

1. Ouvre Chrome et va sur `chrome://extensions`.
2. Active **Mode développeur**.
3. Clique sur **Charger l’extension non empaquetée**.
4. Sélectionne le dossier `extension` situé à la racine du projet (pas le dossier parent).
5. Vérifie que **NBA Sim - 2KRatings Import** est activée.
6. Lance le jeu avec `npm start` puis ouvre `http://127.0.0.1:3001`, ou garde Live Server et laisse Node fonctionner pour le téléchargement des photos.
7. Dans le créateur de joueurs, saisis le nom et le slug, puis clique sur **Récupérer les ratings**.

L’extension réutilise un onglet 2KRatings déjà ouvert. Sinon, elle en crée un. Elle lit les informations affichées dans la page et les renvoie au jeu.

Après toute modification des fichiers de l’extension, retourne dans `chrome://extensions` et clique sur **Actualiser** sur la carte de l’extension.

**Limites :** Chrome doit rester ouvert et l’extension doit être activée. Si 2KRatings affiche un CAPTCHA, une page d’erreur ou ne présente pas les attributs dans son HTML, l’import ne pourra pas les récupérer automatiquement. La photo est également demandée par l’extension. Elle peut échouer séparément si 2KRatings héberge l’image sur un domaine externe non autorisé ou bloque sa récupération.
