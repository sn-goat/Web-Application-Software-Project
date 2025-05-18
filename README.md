# Plateforme de jeu tactique multijoueur – LOG2990

## Description générale du projet

Ce projet vise à développer une plateforme en ligne pour un jeu de rôle tactique multijoueur, minimaliste et modulaire.

Les joueurs participent à des parties sur des cartes quadrillées, composées de tuiles représentant divers types de terrains et d’obstacles. Ils peuvent se déplacer, interagir avec l’environnement (ouvrir des portes, ramasser des items) et s’affronter en combats au tour par tour. Le tout est structuré autour de différents modes de jeu avec des objectifs variés.

La plateforme permet également de gérer plusieurs jeux et inclut un éditeur permettant de créer de nouvelles cartes ou variantes de jeux.

---

## Architecture du projet

Le projet est divisé en deux parties :

- **Client** : développé avec Angular et TypeScript.
- **Serveur** : développé avec NestJS, également en TypeScript, basé sur Node.js et Express, avec une base de données MongoDB et intégration AWS pour certaines fonctionnalités (ex : stockage de ressources, déploiement, etc.).

---

## Technologies utilisées

### Backend

- **TypeScript** : Langage principal pour l'ensemble du projet, assurant typage statique et robustesse.
- **NestJS** : Cadriciel Node.js orienté architecture modulaire et inspiré d’Angular.
- **MongoDB** : Base de données NoSQL flexible, utilisée pour stocker les utilisateurs, parties en cours, cartes, etc.
- **Socket.IO** : Communication en temps réel pour les interactions multijoueurs.
- **AWS (Amazon Web Services)** : Utilisé pour le stockage d’assets et autres services de déploiement.

### Frontend

- **Angular** : Cadriciel web basé sur TypeScript, utilisé pour construire une interface utilisateur réactive et modulaire.
- **SCSS** : Utilisé pour le stylage des composants avec des fonctionnalités avancées de CSS.
- **TypeScript** : Utilisé pour bénéficier d’un développement structuré, typé et maintenable côté client.

---

## Fonctionnalités principales

- Connexion multijoueur avec gestion des sessions
- Déplacement et interaction sur une carte quadrillée
- Tour par tour avec gestion des actions
- Éditeur de cartes et de variantes de jeux
- Stockage et chargement des parties
- Synchronisation en temps réel via WebSocket

---

## Guide de contribution

Se référer au fichier [CONTRIBUTING.md](./CONTRIBUTING.md) pour des conseils et directives de comment maintenir un projet bien organisé et facile à comprendre pour tous les membres de l'équipe.
## Déploiement du projet

Se référer au fichier [DEPLOYMENT.md](DEPLOYMENT.md) pour tout ce qui a rapport avec le déploiement.

# Gestion des dépendances

## Commandes npm

Les commandes commençant par `npm` devront être exécutées dans les dossiers `client` et `server`. Les scripts non standard doivent être lancés en lançant `npm run myScript`.

## Installation des dépendances de l'application

1. Installer `npm`. `npm` vient avec `Node` que vous pouvez télécharger [ici](https://nodejs.org/en/download/)

2. Lancer `npm ci` (Clean Install) pour installer les versions exactes des dépendances du projet. Ceci est possiblement seulement si le fichier `package-lock.json` existe. Ce fichier vous est fourni dans le code de départ.

## Ajout de dépendances aux projets

Vous pouvez ajouter d'autres dépendances aux deux projets avec la commande `npm install nomDependance`.

Pour ajouter une dépendance comme une dépendance de développement (ex : librairie de tests, types TS, etc.) ajoutez l'option `--save-dev` : `npm install nomDependance --save-dev`.

# Outils de développement et assurance qualité

## Tests unitaires et couverture de code

Les deux projets viennent avec des tests unitaires et des outils de mesure de la couverture du code.
Les tests se retrouvent dans les fichiers `*.spec.ts` dans le code source des deux projets. Le client utilise la librairie _Jasmine_ et le serveur utilise _Mocha_, _Chai_, _Sinon_ et _Supertest_ (_Jest_ pour le projet NestJS).

Les commandes pour lancer les tests et la couverture du code sont les suivantes. Il est fortement recommandé de les exécuter souvent, s'assurer que vos tests n'échouent pas et, le cas échéant, corriger les problèmes soulevés par les tests.

-   Exécuter `npm run test` pour lancer les tests unitaires.

-   Exécuter `npm run coverage` pour générer un rapport de couverture de code.
    -   Un rapport sera généré dans la sortie de la console.
    -   Un rapport détaillé sera généré dans le répertoire `/coverage` sous la forme d'une page web. Vous pouvez ouvrir le fichier `index.html` dans votre navigateur et naviguer à travers le rapport. Vous verrez les lignes de code non couvertes par les tests.

## Linter et règles d'assurance qualité

Les deux projets viennent avec un ensemble de règles d'assurance qualité pour le code et son format. L'outil _ESLint_ est un outil d'analyse statique qui permet de détecter certaines odeurs dans le code.

 Intégration continue

Les 2 projets viennent avec une configuration d'intégration continue (_Continuous Integration_ ou _CI_) pour la plateforme GitLab.

Cette configuration permet de lancer un pipeline de validations sur le projet en 3 étapes dans l'ordre suivant: _install_, _lint_ et _test_. Si une de ses étapes échoue, le pipeline est marqué comme échoué et une notification sera visible sur GitLab. La seule exception est l'étape de _lint_ qui ne bloque pas le pipeline si elle échoue, mais donne quand même un avertissement visuel.

