# Lancer Simulation Basketball

## Méthode recommandée (Node.js)

1. Installer **Node.js 18 ou plus récent**.
2. Ouvrir un terminal dans le dossier du projet.
3. Exécuter `npm start`.
4. Ouvrir **http://127.0.0.1:3001**.

Le serveur Node sert le jeu et fournit le relais local utilisé par « Synchroniser ratings ». Aucune dépendance npm supplémentaire n'est nécessaire.

## Avec Live Server

Tu peux aussi conserver Live Server sur le port 5500. Dans ce cas, lance également `npm start` dans un deuxième terminal. Le jeu sur Live Server communiquera avec le relais Node sur le port 3001.

Le relais local évite les restrictions CORS du navigateur. Il ne peut toutefois pas contourner un éventuel blocage, CAPTCHA ou refus HTTP imposé directement par 2KRatings.
