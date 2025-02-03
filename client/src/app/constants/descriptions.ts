import { TileType } from '@common/enums';

export const ASSETS_DESCRIPTION: Map<TileType, string> = new Map([
    [
        TileType.Ice,
        `Glace:
C'est une tuile de terrain qui peut être parcourue par le joueur.
Le coût pour la traverser s'élève à 0 pts`,
    ],
    [
        TileType.Wall,
        `Mur:
Cette tuile bloque le joueur dans ses déplacements. Il ne peut pas la traverser.`,
    ],
    [
        TileType.Closed_Door,
        `Porte :
Cette tuile peut être parcourue par le joueur seulement si elle est dans l'état ouvert.
Afin de changer l'état de cette tuile, vous pouver sélectionner cet outil et cliquer sur une tuile porte`,
    ],
    [
        TileType.Water,
        `Eau :
C'est une tuile de terrain qui peut être parcourue par le joueur.
Le coût pour la traverser s'élève à 2 pts`,
    ],
    [TileType.Opened_Door, ''],
    [TileType.Default, ''],
]);
