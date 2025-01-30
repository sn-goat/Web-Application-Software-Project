import { Tiles, Items } from '@app/enum/tile';

const DEFAULT_PATH_TILES = './assets/tiles/';
const DEFAULT_PATH_ITEMS = './assets/items/';

export const TILES_URL = {
    [Tiles.Default]: DEFAULT_PATH_TILES + 'Base.png',
    [Tiles.Water]: DEFAULT_PATH_TILES + 'Water.png',
    [Tiles.Wall]: DEFAULT_PATH_TILES + 'Wall.png',
    [Tiles.OpenDoor]: DEFAULT_PATH_TILES + 'OpenedDoor.png',
    [Tiles.CloseDoor]: DEFAULT_PATH_TILES + 'ClosedDoor.png',
    [Tiles.Ice]: DEFAULT_PATH_TILES + 'Ice.png',
};

export const ITEM_TO_TYPE = {
    [DEFAULT_PATH_ITEMS + 'Sword.png']: Items.Attribute,
    [DEFAULT_PATH_ITEMS + 'Shield.png']: Items.Attribute,
    [DEFAULT_PATH_ITEMS + 'Leather Boot.png']: Items.Condition,
    [DEFAULT_PATH_ITEMS + 'Monster Egg.png']: Items.Condition,
    [DEFAULT_PATH_ITEMS + 'Pearl.png']: Items.Game,
    [DEFAULT_PATH_ITEMS + 'Bow.png']: Items.Game,
    [DEFAULT_PATH_ITEMS + 'Flag.png']: Items.Flag,
    [DEFAULT_PATH_ITEMS + '']: Items.StartingPoint,
};

export const ITEM_URL = [
    DEFAULT_PATH_ITEMS + 'Sword.png',
    DEFAULT_PATH_ITEMS + 'Shield.png',
    DEFAULT_PATH_ITEMS + 'Leather Boot.png',
    DEFAULT_PATH_ITEMS + 'Monster Egg.png',
    DEFAULT_PATH_ITEMS + 'Pearl.png',
    DEFAULT_PATH_ITEMS + 'Bow.png',
    DEFAULT_PATH_ITEMS + 'Flag.png',
];
