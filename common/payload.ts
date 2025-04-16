import { Cell, Vec2 } from './board';
import { Item } from './enums';
import { DoorState, PathInfo } from './game';
import { Entry } from './journal';
import { IPlayer, PlayerInput, VirtualPlayerStyles } from './player';
import { Stats } from './stats';

export enum FightResultType {
    Tie = 'tie',
    Decisive = 'decisive',
}

export interface FightResult {
    type: FightResultType;
    winner?: IPlayer;
    loser?: IPlayer;
}

export interface FightTimerUpdatePayload {
    accessCode: string;
    remainingTime: number;
}

export interface TurnTimerUpdatePayload {
    accessCode: string;
    remainingTime: number;
}

export interface DebugStateChangedPayload {
    accessCode: string;
    newState: boolean;
}

export interface MapUpdatePayload {
    accessCode: string;
    map: Cell[][];
}

export interface WinnerPayload {
    accessCode: string;
    player: IPlayer;
}

export interface PlayerMovePayload {
    accessCode: string;
    previousPosition: Vec2;
    player: IPlayer;
}

export interface DoorStateChangedPayload {
    accessCode: string;
    doorState: DoorState;
}

export interface UpdateTurnPayload {
    player: IPlayer;
    path: Record<string, PathInfo>;
}

export interface ChangeTurnPayload {
    accessCode: string;
    player: IPlayer;
    path: Record<string, PathInfo>;
}

export interface DispatchStatsPayload {
    accessCode: string;
    stats: Stats;
}

export interface JournalEntryPayload {
    accessCode: string;
    entry: Entry;
}

export interface FightEndPayload {
    accessCode: string;
    fightResult: FightResult;
}

export interface ItemCollectedPayload {
    accessCode: string;
    player: IPlayer;
    position: Vec2;
}

export interface InventoryFullPayload {
    accessCode: string;
    player: IPlayer;
    item: Item;
    position: Vec2;
}

export interface DroppedItemPayload {
    accessCode: string;
    player: IPlayer;
    droppedItems: { item: Item; position: Vec2 }[];
}

export interface ReadyPayload {
    accessCode: string;
    playerId: string;
}

export interface PlayerMovementPayload {
    accessCode: string;
    path: PathInfo;
    playerId: string;
}

export interface DebugMovePayload {
    accessCode: string;
    direction: Vec2;
    playerId: string;
}

export interface ChangeDoorStatePayload {
    accessCode: string;
    doorPosition: Vec2;
    playerId: string;
}

export interface FightInitPayload {
    accessCode: string;
    playerInitiatorId: string;
    playerDefenderId: string;
}

export interface InventoryChoicePayload {
    playerId: string;
    itemToThrow: Item;
    itemToAdd: Item;
    position: Vec2;
    accessCode: string;
}

export interface UpdatePlayersPayload {
    accessCode: string;
    players: IPlayer[];
}

export interface ShareCharacterPayload {
    accessCode: string;
    player: PlayerInput;
}

export interface CreateVirtualPlayerPayload {
    accessCode: string;
    playerStyle: VirtualPlayerStyles;
}

export interface RemovePlayerPayload {
    accessCode: string;
    playerId: string;
}

export interface DisconnectPlayerPayload {
    accessCode: string;
    playerId: string;
}
