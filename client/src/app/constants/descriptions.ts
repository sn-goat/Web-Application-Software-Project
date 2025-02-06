import { Tile } from '@common/enums';

export const ASSETS_DESCRIPTION: Map<Tile, string> = new Map([
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
]);
