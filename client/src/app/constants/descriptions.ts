import { Item, Tile } from '@common/enums';

export const ASSETS_DESCRIPTION = new Map<Tile | Item, string>([
    [
        Tile.ICE,
        `Glace:
C'est une tuile de terrain qui peut être parcourue par le joueur.
Le coût pour la traverser s'élève à 0 pts`,
    ],
    [
        Tile.WALL,
        `Mur:
Cette tuile bloque le joueur dans ses déplacements. Il ne peut pas la traverser.`,
    ],
    [
        Tile.CLOSED_DOOR,
        `Porte :
Cette tuile est accessible si elle est ouverte.
Pour changer son état, utilisez cet outil et clique droit sur une tuile porte.`,
    ],
    [
        Tile.WATER,
        `Eau :
C'est une tuile de terrain qui peut être parcourue par le joueur.
Le coût pour la traverser s'élève à 2 pts`,
    ],
    [
        Tile.OPENED_DOOR,
        `Porte ouverte :
Cette tuile est accessible et permet au joueur de passer librement.`,
    ],

    [
        Tile.FLOOR,
        `Sol :
C'est une tuile de terrain qui peut être parcourue par le joueur. Le coût pour la traverser s'élève à 1 pt.`,
    ],

    // Descriptions for items
    [Item.BOW, 'Arc : Une arme à distance utilisée pour attaquer les ennemis de loin.'],
    [Item.FLAG, 'Drapeau : Un symbole de victoire ou de capture dans le jeu.'],
    [Item.LEATHER_BOOT, 'Bottes en cuir : Augmente la vitesse de déplacement du joueur.'],
    [Item.MONSTER_EGG, 'Œuf de monstre : Peut éclore en un monstre allié ou ennemi.'],
    [Item.PEARL, 'Perle : Un objet précieux pouvant être échangé contre des ressources.'],
    [Item.SHIELD, 'Bouclier : Utilisé pour se protéger contre les attaques ennemies.'],
    [Item.SWORD, 'Épée : Une arme de mêlée utilisée pour attaquer les ennemis de près.'],
    [Item.SPAWN, 'Point de spawn : Lieu où les joueurs apparaissent au début du jeu.'],
    [Item.CHEST, 'Coffre : Contient des objets et des ressources pour le joueur. (Aléatoire)'],
    [Item.DEFAULT, ''],
]);
