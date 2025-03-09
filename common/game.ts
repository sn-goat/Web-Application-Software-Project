import { Cell } from "./board";
import { PlayerStats } from "./player";

export interface Room {
    accessCode: string;
    organizerId: string;
    players: PlayerStats[];
    isLocked: boolean;
    mapSize: number;
}

export interface Game {
    organizerId: string;
    players: PlayerStats[];
    map: Cell[][];
    currentTurn: number;
    isDebugMode: boolean;
}

export const ASSET_PATH = "./assets/portraits/portrait";
export const ASSET_EXT = ".png";

export enum Avatar {
    Dwarf = ASSET_PATH + "1" + ASSET_EXT,
    Elf = ASSET_PATH + "2" + ASSET_EXT,
    Rogue = ASSET_PATH + "3" + ASSET_EXT,
    Knight = ASSET_PATH + "4" + ASSET_EXT,
    Lancer = ASSET_PATH + "5" + ASSET_EXT,
    Warlock = ASSET_PATH + "6" + ASSET_EXT,
    Wizard = ASSET_PATH + "7" + ASSET_EXT,
    Paladin = ASSET_PATH + "8" + ASSET_EXT,
    Berserker = ASSET_PATH + "9" + ASSET_EXT,
    Cleric = ASSET_PATH + "10" + ASSET_EXT,
    Farmer = ASSET_PATH + "11" + ASSET_EXT,
    Hermit = ASSET_PATH + "12" + ASSET_EXT,
    Default = ''
};
