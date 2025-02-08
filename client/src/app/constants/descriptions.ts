import { Item, Tile } from '@common/enums';

export const ASSETS_DESCRIPTION = new Map<Tile | Item, string>([
    [
        Tile.Ice,
        `Glace:
C'est une tuile de terrain qui peut être parcourue par le joueur.
Le coût pour la traverser s'élève à 0 pts`,
    ],
    [
        Tile.Wall,
        `Mur:
Cette tuile bloque le joueur dans ses déplacements. Il ne peut pas la traverser.`,
    ],
    [
        Tile.Closed_Door,
        `Porte :
Cette tuile peut être parcourue par le joueur seulement si elle est dans l'état ouvert.
Afin de changer l'état de cette tuile, vous pouver sélectionner cet outil et cliquer sur une tuile porte`,
    ],
    [
        Tile.Water,
        `Eau :
C'est une tuile de terrain qui peut être parcourue par le joueur.
Le coût pour la traverser s'élève à 2 pts`,
    ],
    [Tile.Opened_Door, ''],
    [Tile.Default, ''],

    // Descriptions for items
    [Item.Bow, 'Arc : Une arme à distance utilisée pour attaquer les ennemis de loin.'],
    [Item.Flag, 'Drapeau : Un symbole de victoire ou de capture dans le jeu.'],
    [Item.Leather_Boot, 'Bottes en cuir : Augmente la vitesse de déplacement du joueur.'],
    [Item.Monster_Egg, 'Œuf de monstre : Peut éclore en un monstre allié ou ennemi.'],
    [Item.Pearl, 'Perle : Un objet précieux pouvant être échangé contre des ressources.'],
    [Item.Shield, 'Bouclier : Utilisé pour se protéger contre les attaques ennemies.'],
    [Item.Sword, 'Épée : Une arme de mêlée utilisée pour attaquer les ennemis de près.'],
    [Item.Spawn, 'Point de spawn : Lieu où les joueurs apparaissent au début du jeu.'],
    [Item.Chest, 'Coffre : Contient des objets et des ressources pour le joueur.'],
    [Item.Default, ''],
]);
