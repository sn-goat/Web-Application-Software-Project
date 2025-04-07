import { Cell, Vec2 } from './board';
import { IPlayer } from './player';

export interface IRoom {
    accessCode: string;
    organizerId: string;
    isLocked: boolean;
    game: IGame;
}

export interface IGame {
    players: IPlayer[];
    map: Cell[][];
    currentTurn: number;
    isDebugMode: boolean;
    maxPlayers: number;
    isCTF: boolean;
}

export interface GameFormData {
    name: string;
    description: string;
    size: number;
    isCTF: boolean;
}

export const MAX_FIGHT_WINS = 3;

export interface IFight {
    player1: IPlayer;
    player2: IPlayer;
    currentPlayer: IPlayer;
}

export const ASSET_PATH = './assets/character-animations/portrait';
export const ASSET_EXT = '.gif';
export const ACCESS_CODE_REGEX = /^\d{4}$/;

export enum Avatar {
    Dwarf = ASSET_PATH + '1' + ASSET_EXT,
    Elf = ASSET_PATH + '2' + ASSET_EXT,
    Rogue = ASSET_PATH + '3' + ASSET_EXT,
    Knight = ASSET_PATH + '4' + ASSET_EXT,
    Lancer = ASSET_PATH + '5' + ASSET_EXT,
    Warlock = ASSET_PATH + '6' + ASSET_EXT,
    Wizard = ASSET_PATH + '7' + ASSET_EXT,
    Paladin = ASSET_PATH + '8' + ASSET_EXT,
    Berserker = ASSET_PATH + '9' + ASSET_EXT,
    Cleric = ASSET_PATH + '10' + ASSET_EXT,
    Farmer = ASSET_PATH + '11' + ASSET_EXT,
    Hermit = ASSET_PATH + '12' + ASSET_EXT,
    Default = '',
}

const avatarNameMap = Object.entries(Avatar).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {} as Record<string, string>);

export function getAvatarName(avatar: Avatar): string {
    return avatarNameMap[avatar] || 'Unknown';
}

export interface TurnInfo {
    player: IPlayer;
    path: Map<string, PathInfo>;
}

export interface PathInfo {
    path: Vec2[];
    cost: number;
}
