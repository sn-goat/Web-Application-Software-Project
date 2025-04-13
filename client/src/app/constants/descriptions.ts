import { Item, Tile } from '@common/enums';

export const ASSETS_DESCRIPTION = new Map<Tile | Item, string>([
    [
        Tile.Ice,
        `Glace:
C'est une tuile de terrain qui peut être parcourue par le joueur.
Le coût pour la traverser s'élève à 0 pts. Vous perdez 2 points à l'attaque et à la défense lorsque vous êtes sur cette tuile.`,
    ],
    [
        Tile.Wall,
        `Mur:
Cette tuile bloque le joueur dans ses déplacements. Il ne peut pas la traverser.`,
    ],
    [
        Tile.ClosedDoor,
        `Porte :
Cette tuile est accessible si elle est ouverte.
Pour changer son état, utilisez cet outil et clique droit sur une tuile porte.`,
    ],
    [
        Tile.Water,
        `Eau :
C'est une tuile de terrain qui peut être parcourue par le joueur.
Le coût pour la traverser s'élève à 2 pts`,
    ],
    [
        Tile.OpenedDoor,
        `Porte ouverte :
Cette tuile est accessible et permet au joueur de passer librement.`,
    ],

    [
        Tile.Floor,
        `Sol :
C'est une tuile de terrain qui peut être parcourue par le joueur. Le coût pour la traverser s'élève à 1 pt.`,
    ],

    [Item.Bow, 'Arc : Permet d’attaquer en diagonale (1 case)'],
    [Item.Flag, 'Drapeau : Un symbole de victoire ou de capture dans le jeu.'],
    [Item.LeatherBoot, 'Bottes en cuir : Évite les effets négatifs de la glace.'],
    [Item.MonsterEgg, 'Œuf de monstre : Permet de se téléporter sur la carte depuis son spawn.'],
    [Item.Pearl, 'Perle : Permet de revenir à la vie si vaincu durant un combat (1 fois/combat).'],
    [Item.Shield, 'Bouclier : Ajoute +2 à la défense et -1 à la rapidité.'],
    [Item.Sword, 'Épée :  Ajoute un +1 à l’attaque et -1 à la défense.'],
    [Item.Spawn, 'Point de spawn : Lieu où les joueurs apparaissent au début du jeu.'],
    [Item.Chest, 'Coffre : Contient des objets et des ressources pour le joueur. (Aléatoire)'],
    [Item.Default, ''],
]);
