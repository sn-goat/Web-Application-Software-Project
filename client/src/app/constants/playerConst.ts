import { Dice } from '@common/player';

export const MAX_PORTRAITS = 12;
export const MAX_PLAYERS = 6;
const D4 = './assets/dice/d4.png';
const D6 = './assets/dice/d6.png';

export function diceToImageLink(dice: Dice): string {
    return dice === 'D4' ? D4 : D6;
}
