import { Size } from '@common/enums';

const SMALL_MAP_MAX_ITEMS_PLAYERS = 2;
const MEDIUM_MAP_MAX_ITEMS_PLAYERS = 4;
const LARGE_MAP_MAX_ITEMS_PLAYERS = 6;

export const BOARD_SIZE_MAPPING: { [key in Size]: number } = {
    [Size.Small]: SMALL_MAP_MAX_ITEMS_PLAYERS,
    [Size.Medium]: MEDIUM_MAP_MAX_ITEMS_PLAYERS,
    [Size.Large]: LARGE_MAP_MAX_ITEMS_PLAYERS,
};
