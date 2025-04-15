import { Game } from '@app/class/game';
import { FightResult } from '@app/constants/fight-interface';
import {
    InternalFightEvents,
    InternalGameEvents,
    InternalJournalEvents,
    InternalRoomEvents,
    InternalStatsEvents,
    InternalTimerEvents,
    InternalTurnEvents,
} from '@app/constants/internal-events';
import { Board } from '@app/model/database/board';
import { Vec2 } from '@common/board';
import { ChatMessage } from '@common/chat';
import { Item } from '@common/enums';
import { DoorState, GamePhase, IRoom, PathInfo } from '@common/game';
import { Entry } from '@common/journal';
import {
    ChangeTurnPayload,
    DebugStateChangedPayload,
    DispatchStatsPayload,
    DoorStateChangedPayload,
    DroppedItemPayload,
    FightEndPayload,
    FightTimerUpdatePayload,
    InventoryFullPayload,
    ItemCollectedPayload,
    JournalEntryPayload,
    MapUpdatePayload,
    PlayerMovePayload,
    TurnTimerUpdatePayload,
    UpdatePlayersPayload,
    WinnerPayload,
} from '@common/payload';
import { VirtualPlayerStyles } from '@common/player';
import { Stats } from '@common/stats';
import { EventEmitter2 } from 'eventemitter2';
import { Fight } from './fight';
import { Player } from './player';
import { VirtualPlayer } from './virtual-player';

export class Room implements IRoom {
    accessCode: string;
    organizerId: string;
    isLocked: boolean;
    game: Game;
    chatHistory: ChatMessage[] = [];
    private internalEmitter: EventEmitter2;
    private globalEmitter: EventEmitter2;

    private readonly confirmDisconnectMessage = 'Vous avez quitté la partie avec succès';
    private readonly adminDisconnectMessage = "La partie a été fermée dû à la déconnection de l'organisateur";
    private readonly playerBanMessage = "Vous avez été expulsé de la partie par l'organisateur";
    private readonly notEnoughPlayersMessage = "Il n'y pas assez de joueurs pour continuer la partie";

    constructor(globalEmitter: EventEmitter2, accessCode: string, organizerId: string, board: Board) {
        this.accessCode = accessCode;
        this.organizerId = organizerId;
        this.isLocked = false;
        this.internalEmitter = new EventEmitter2();
        this.globalEmitter = globalEmitter;
        this.game = new Game(this.internalEmitter, board);

        // When a player is removed, emit a typed payload.
        this.internalEmitter.on(InternalRoomEvents.PlayerRemoved, (playerId: string, message: string) => {
            this.globalEmitter.emit(InternalRoomEvents.PlayerRemoved, this.accessCode, playerId, message);
        });

        this.internalEmitter.on(InternalTimerEvents.TurnUpdate, (remainingTime) => {
            const payload: TurnTimerUpdatePayload = { accessCode: this.accessCode, remainingTime };
            this.globalEmitter.emit(InternalTimerEvents.TurnUpdate, payload);
        });

        this.internalEmitter.on(InternalStatsEvents.DispatchStats, (stats: Stats) => {
            const payload: DispatchStatsPayload = { accessCode: this.accessCode, stats };
            this.globalEmitter.emit(InternalStatsEvents.DispatchStats, payload);
        });

        this.internalEmitter.on(InternalJournalEvents.Add, (entry: Entry) => {
            const payload: JournalEntryPayload = { accessCode: this.accessCode, entry };
            this.globalEmitter.emit(InternalJournalEvents.Add, payload);
        });

        this.internalEmitter.on(InternalTimerEvents.FightUpdate, (remainingTime) => {
            const payload: FightTimerUpdatePayload = { accessCode: this.accessCode, remainingTime };
            this.globalEmitter.emit(InternalTimerEvents.FightUpdate, payload);
        });

        this.internalEmitter.on(InternalGameEvents.MapUpdated, (map) => {
            const payload: MapUpdatePayload = { accessCode: this.accessCode, map };
            this.globalEmitter.emit(InternalGameEvents.MapUpdated, payload);
        });

        this.internalEmitter.on(InternalTurnEvents.Move, (movement: { previousPosition: Vec2; player: Player }) => {
            const payload: PlayerMovePayload = {
                accessCode: this.accessCode,
                previousPosition: movement.previousPosition,
                player: movement.player,
            };
            this.globalEmitter.emit(InternalTurnEvents.Move, payload);
        });

        this.internalEmitter.on(InternalTurnEvents.Update, (turn: { player: Player; path: Record<string, PathInfo> }) => {
            // Assuming the contract for InternalTurnEvents.Update remains unchanged.
            this.globalEmitter.emit(InternalTurnEvents.Update, turn);
        });

        this.internalEmitter.on(InternalTurnEvents.ChangeTurn, (turn: { player: Player; path: Record<string, PathInfo> }) => {
            const payload: ChangeTurnPayload = { accessCode: this.accessCode, player: turn.player, path: turn.path };
            this.globalEmitter.emit(InternalTurnEvents.ChangeTurn, payload);
        });

        this.internalEmitter.on(InternalTurnEvents.Start, (playerId: string) => {
            this.globalEmitter.emit(InternalTurnEvents.Start, playerId);
        });

        this.internalEmitter.on(InternalFightEvents.Init, (fight: Fight) => {
            this.globalEmitter.emit(InternalFightEvents.Init, fight);
        });

        this.internalEmitter.on(InternalTurnEvents.DoorStateChanged, (doorState: DoorState) => {
            const payload: DoorStateChangedPayload = { accessCode: this.accessCode, doorState };
            this.globalEmitter.emit(InternalTurnEvents.DoorStateChanged, payload);
        });

        this.internalEmitter.on(InternalFightEvents.ChangeFighter, (fight: Fight) => {
            this.globalEmitter.emit(InternalFightEvents.ChangeFighter, fight);
        });

        this.internalEmitter.on(InternalFightEvents.End, (fightResult: FightResult) => {
            const payload: FightEndPayload = { accessCode: this.accessCode, fightResult };
            this.globalEmitter.emit(InternalFightEvents.End, payload);
        });

        this.internalEmitter.on(InternalTurnEvents.ItemCollected, (data: { player: Player; position: Vec2 }) => {
            const payload: ItemCollectedPayload = { accessCode: this.accessCode, player: data.player, position: data.position };
            this.globalEmitter.emit(InternalTurnEvents.ItemCollected, payload);
        });

        this.internalEmitter.on(InternalTurnEvents.DroppedItem, (data: { player: Player; droppedItems: { item: Item; position: Vec2 }[] }) => {
            const payload: DroppedItemPayload = { accessCode: this.accessCode, player: data.player, droppedItems: data.droppedItems };
            this.globalEmitter.emit(InternalTurnEvents.DroppedItem, payload);
        });

        this.internalEmitter.on(InternalTurnEvents.InventoryFull, (data: { player: Player; item: Item; position: Vec2 }) => {
            const payload: InventoryFullPayload = { accessCode: this.accessCode, player: data.player, item: data.item, position: data.position };
            this.globalEmitter.emit(InternalTurnEvents.InventoryFull, payload);
        });

        this.internalEmitter.on(InternalGameEvents.Winner, (player: Player) => {
            const payload: WinnerPayload = { accessCode: this.accessCode, player };
            this.globalEmitter.emit(InternalGameEvents.Winner, payload);
        });
    }

    setLock(isLocked: boolean): void {
        this.isLocked = isLocked;
    }

    isPlayerAdmin(playerId: string): boolean {
        return this.organizerId === playerId;
    }

    getPlayers(): Player[] {
        return this.game.players;
    }

    addPlayer(player: Player): string[] | null {
        if (this.isAvatarTaken(player)) {
            return this.getPlayers().map((p) => p.avatar);
        }
        this.generateUniquePlayerName(player);
        this.game.addPlayer(player);
        if (this.game.isGameFull()) {
            this.isLocked = true;
        }
        return null;
    }

    addVirtualPlayer(playerStyle: VirtualPlayerStyles): void {
        const virtualPlayer = new VirtualPlayer(this.game.players, playerStyle);
        this.game.addPlayer(virtualPlayer);
        if (this.game.isGameFull()) {
            this.isLocked = true;
        }
    }

    expelPlayer(playerId: string): void {
        this.game.removePlayer(playerId, this.playerBanMessage);
        const payload: UpdatePlayersPayload = { accessCode: this.accessCode, players: this.getPlayers() };
        this.globalEmitter.emit(InternalRoomEvents.PlayersUpdated, payload);
    }

    removePlayer(playerId: string): void {
        switch (this.game.gamePhase) {
            case GamePhase.Lobby:
                this.removePlayerFromLobby(playerId);
                break;
            case GamePhase.InGame:
                this.removePlayerFromGame(playerId);
                break;
            case GamePhase.AfterGame:
                this.game.removePlayer(playerId, this.confirmDisconnectMessage);
                if (!this.game.hasPhysicalPlayers()) {
                    this.globalEmitter.emit(InternalRoomEvents.CloseRoom, this.accessCode);
                }
                break;
        }
    }

    closeRoom(): void {
        if (this.game) {
            this.game.timer.stopTimer();
        }
        this.internalEmitter.removeAllListeners();
        this.removeAllPlayers();
        if (this.game) {
            this.game.closeGame();
            this.game = null;
        }
        this.globalEmitter = null;
        this.internalEmitter = null;
    }

    removeAllPlayers(): void {
        for (const player of this.getPlayers()) {
            this.game.removePlayer(player.id, this.confirmDisconnectMessage);
        }
    }

    addMessage(message: ChatMessage): void {
        this.chatHistory.push(message);
    }

    private removePlayerFromLobby(playerId: string): void {
        if (this.isPlayerAdmin(playerId)) {
            for (const player of this.getPlayers().filter((p) => p.id !== playerId)) {
                this.game.removePlayer(player.id, this.adminDisconnectMessage);
            }
            this.game.removePlayer(playerId, this.confirmDisconnectMessage);
            this.globalEmitter.emit(InternalRoomEvents.CloseRoom, this.accessCode);
        } else {
            this.game.removePlayer(playerId, this.confirmDisconnectMessage);
            const payload: UpdatePlayersPayload = { accessCode: this.accessCode, players: this.getPlayers() };
            this.globalEmitter.emit(InternalRoomEvents.PlayersUpdated, payload);
        }
    }

    private removePlayerFromGame(playerId: string): void {
        const wasPlayerTurn = this.game.isPlayerTurn(playerId);
        this.game.removePlayerOnMap(playerId);
        this.game.removePlayer(playerId, this.confirmDisconnectMessage);
        this.game.dropItems(playerId);
        if (!this.game.canGameContinue()) {
            const lastPlayer = this.game.getPhysicalPlayers().pop();
            if (lastPlayer) {
                this.game.removePlayer(lastPlayer.id, this.notEnoughPlayersMessage);
            }
            this.globalEmitter.emit(InternalRoomEvents.CloseRoom, this.accessCode);
            return;
        }
        const updatePayload: UpdatePlayersPayload = { accessCode: this.accessCode, players: this.getPlayers() };
        this.globalEmitter.emit(InternalRoomEvents.PlayersUpdated, updatePayload);
        if (this.isPlayerAdmin(playerId) && this.game.isDebugMode) {
            this.game.isDebugMode = false;
            const debugPayload: DebugStateChangedPayload = { accessCode: this.accessCode, newState: false };
            this.globalEmitter.emit(InternalGameEvents.DebugStateChanged, debugPayload);
        }
        if (this.game.isPlayerInFight(playerId)) {
            this.game.removePlayerFromFight(playerId);
        }
        if (wasPlayerTurn) {
            this.game.currentTurn = this.game.currentTurn % this.game.players.length;
            this.game.startTurn();
        }
    }

    private generateUniquePlayerName(player: Player): void {
        const existingNames = this.getPlayers().map((p) => p.name);
        const baseName = player.name;
        let nameToAssign = baseName;
        let suffix = 1;
        while (existingNames.includes(nameToAssign)) {
            suffix++;
            nameToAssign = `${baseName}-${suffix}`;
        }
        player.name = nameToAssign;
    }

    private isAvatarTaken(player: Player): boolean {
        const takenAvatars = this.getPlayers().map((p) => p.avatar);
        return takenAvatars.includes(player.avatar);
    }
}
