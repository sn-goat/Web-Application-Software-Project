import { Item, Tile } from '@common/enums';

export const ASSETS_DESCRIPTION = new Map<Tile | Item, string>([
    [
        Tile.ICE,
        `Glace:
C'est une tuile de terrain qui peut être parcourue par le joueur.
Le coût pour la traverser s'élève à 0 pts. Vous perdez 2 points à l'attaque et à la défense lorsque vous êtes sur cette tuile.`,
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

    [Item.BOW, 'Arc : Permet d’attaquer en diagonale (1 case)'],
    [Item.FLAG, 'Drapeau : Un symbole de victoire ou de capture dans le jeu.'],
    [Item.LEATHER_BOOT, 'Bottes en cuir : Évite les effets négatifs de la glace.'],
    [Item.MONSTER_EGG, 'Œuf de monstre : Permet de se téléporter sur la carte depuis son spawn.'],
    [Item.PEARL, 'Perle : Permet de revenir à la vie si vaincu durant un combat (1 fois/combat).'],
    [Item.SHIELD, 'Bouclier : Ajoute +2 à la défense et -1 à la rapidité.'],
    [Item.SWORD, 'Épée :  Ajoute un +1 à l’attaque et -1 à la défense.'],
    [Item.SPAWN, 'Point de spawn : Lieu où les joueurs apparaissent au début du jeu.'],
    [Item.CHEST, 'Coffre : Contient des objets et des ressources pour le joueur. (Aléatoire)'],
    [Item.DEFAULT, ''],
]);
