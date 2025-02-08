import { Size } from '@common/enums';

const SMALL_MAP_MAX_ITEMS_PLAYERS = 2;
const MEDIUM_MAP_MAX_ITEMS_PLAYERS = 4;
const LARGE_MAP_MAX_ITEMS_PLAYERS = 6;

export const BOARD_SIZE_MAPPING: { [key in Size]: number } = {
    [Size.SMALL]: SMALL_MAP_MAX_ITEMS_PLAYERS,
    [Size.MEDIUM]: MEDIUM_MAP_MAX_ITEMS_PLAYERS,
    [Size.LARGE]: LARGE_MAP_MAX_ITEMS_PLAYERS,
};
