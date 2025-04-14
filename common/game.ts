import { Cell, Vec2 } from './board';
import { Item, Tile } from './enums';
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

export interface GameStats {
    gameDuration?: string;
    tilesVisitedPercentage?: string;
    tilesVisited?: Set<Vec2>;
    doorsHandled?: Set<Vec2>;
    doorsHandledPercentage?: string;
    flagsCaptured?: Set<string>;
    flagsCapturedCount?: number;
    disconnectedPlayers?: IPlayer[];
    tilesNumber?: number;
    doorsNumber?: number;
    timeStartOfGame?: Date;
    timeEndOfGame?: Date;
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

export enum GamePhase {
    Lobby = 'LOBBY',
    InGame = 'IN_GAME',
    AfterGame = 'AFTER_GAME',
}

export const ASSET_PATH_ANIMATED = './assets/character-animations/portrait';
export const ASSET_EXT_ANIMATED = '.gif';
export const ASSET_PATH_STATIC = './assets/portraits/portrait';
export const ASSET_EXT_STATIC = '.png';
export const ACCESS_CODE_REGEX = /^\d{4}$/;

export enum Avatar {
    Nain = ASSET_PATH_STATIC + '1' + ASSET_EXT_STATIC,
    Elfe = ASSET_PATH_STATIC + '2' + ASSET_EXT_STATIC,
    Roublard = ASSET_PATH_STATIC + '3' + ASSET_EXT_STATIC,
    Chevalier = ASSET_PATH_STATIC + '4' + ASSET_EXT_STATIC,
    Lancier = ASSET_PATH_STATIC + '5' + ASSET_EXT_STATIC,
    Démoniste = ASSET_PATH_STATIC + '6' + ASSET_EXT_STATIC,
    Magicien = ASSET_PATH_STATIC + '7' + ASSET_EXT_STATIC,
    Paladin = ASSET_PATH_STATIC + '8' + ASSET_EXT_STATIC,
    Berserker = ASSET_PATH_STATIC + '9' + ASSET_EXT_STATIC,
    Clerc = ASSET_PATH_STATIC + '10' + ASSET_EXT_STATIC,
    Fermier = ASSET_PATH_STATIC + '11' + ASSET_EXT_STATIC,
    Ermite = ASSET_PATH_STATIC + '12' + ASSET_EXT_STATIC,
    Default = '',
}

const avatarNameMap = Object.entries(Avatar).reduce(
    (acc, [key, value]) => {
        acc[value] = key;
        return acc;
    },
    {} as Record<string, string>,
);

export function getAvatarName(avatar: Avatar): string {
    return avatarNameMap[avatar] || 'Unknown';
}

export interface DoorState {
    position: Vec2;
    state: Tile.OpenedDoor | Tile.ClosedDoor;
}

export interface TurnInfo {
    player: IPlayer;
    path: Map<string, PathInfo>;
}

export interface PathInfo {
    path: Vec2[];
    cost: number;
}

export interface VirtualPlayerInstructions {
    action: VirtualPlayerAction;
    pathInfo?: PathInfo;
    target?: Vec2;
}

export enum VirtualPlayerAction {
    Move = 'MOVE',
    InitFight = 'INIT_FIGHT',
    Attack = 'ATTACK',
    Flee = 'FLEE',
    OpenDoor = 'OPENED_DOOR',
    EndTurn = 'END_TURN',
}

export interface CellEvaluation {
    score: number;
    path: Vec2[];
}

export const ATTACK_ITEMS = new Set([Item.Sword, Item.Bow]);

export const DEFENSE_ITEMS = new Set([Item.Shield, Item.Pearl]);
