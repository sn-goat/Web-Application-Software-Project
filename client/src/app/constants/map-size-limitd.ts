import { BoardSize } from '@common/enums';

const SMALL_MAP_MAX_ITEMS_PLAYERS = 2;
const MEDIUM_MAP_MAX_ITEMS_PLAYERS = 4;
const LARGE_MAP_MAX_ITEMS_PLAYERS = 6;

export const BOARD_SIZE_MAPPING: { [key in BoardSize]: number } = {
    [BoardSize.Small]: SMALL_MAP_MAX_ITEMS_PLAYERS,
    [BoardSize.Medium]: MEDIUM_MAP_MAX_ITEMS_PLAYERS,
    [BoardSize.Large]: LARGE_MAP_MAX_ITEMS_PLAYERS,
};
