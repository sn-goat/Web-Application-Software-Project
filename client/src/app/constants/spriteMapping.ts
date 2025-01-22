import { Tiles, Items } from '@app/enum/tile';

export const TILES_URL = {
    [Tiles.Default]: 'default',
    [Tiles.Water]: ['water'],
    [Tiles.Wall]: ['wall'],
    [Tiles.OpenDoor]: ['openDoor'],
    [Tiles.CloseDoor]: ['closeDoor'],
    [Tiles.Ice]: 'ice',
};

export const ITEMS_URL = {
    [Items.Attribute]: 'attribute',
    [Items.Game]: 'game',
    [Items.Condition]: 'condition',
    [Items.Shuffle]: '@assets/objects/Chest.png',
    [Items.StartingPoint]: 'startingPoint',
    [Items.Flag]: 'flag',
};
