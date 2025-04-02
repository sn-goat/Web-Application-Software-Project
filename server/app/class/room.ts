import { Game } from '@app/class/game';
import { InternalFightEvents, InternalGameEvents, InternalRoomEvents, InternalTimerEvents, InternalTurnEvents } from '@app/constants/internal-events';
import { Vec2 } from '@common/board';
import { IRoom, PathInfo } from '@common/game';
import { EventEmitter2 } from 'eventemitter2';
import { Player } from './player';
import { Fight } from './fight';
import { Board } from '@app/model/database/board';

export class Room implements IRoom {
    accessCode: string;
    organizerId: string;
    isLocked: boolean;
    game: Game;

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

        this.internalEmitter.on(InternalRoomEvents.PlayerRemoved, (playerId: string, message: string) => {
            this.globalEmitter.emit(InternalRoomEvents.PlayerRemoved, { accessCode: this.accessCode, playerId, message });
        });

        this.internalEmitter.on(InternalTimerEvents.TurnUpdate, (remainingTime) => {
            this.globalEmitter.emit(InternalTimerEvents.TurnUpdate, { accessCode: this.accessCode, remainingTime });
        });

        this.internalEmitter.on(InternalTimerEvents.FightUpdate, (remainingTime) => {
            this.globalEmitter.emit(InternalTimerEvents.FightUpdate, { accessCode: this.accessCode, remainingTime });
        });

        this.internalEmitter.on(InternalTurnEvents.Move, (movement: { previousPosition: Vec2; player: Player }) => {
            this.globalEmitter.emit(InternalTurnEvents.Move, {
                accessCode: this.accessCode,
                previousPosition: movement.previousPosition,
                player: movement.player,
            });
        });

        this.internalEmitter.on(InternalTurnEvents.Update, (turn: { player: Player; path: Record<string, PathInfo> }) => {
            this.globalEmitter.emit(InternalTurnEvents.Update, turn);
        });

        this.internalEmitter.on(InternalTurnEvents.ChangeTurn, (turn: { player: Player; path: Record<string, PathInfo> }) => {
            this.globalEmitter.emit(InternalTurnEvents.ChangeTurn, { accessCode: this.accessCode, player: turn.player, path: turn.path });
        });

        this.internalEmitter.on(InternalTurnEvents.Start, (playerId: string) => {
            this.globalEmitter.emit(InternalTurnEvents.Start, playerId);
        });

        this.internalEmitter.on(InternalFightEvents.ChangeFighter, (fight: Fight) => {
            this.globalEmitter.emit(InternalFightEvents.ChangeFighter, fight);
        });

        this.internalEmitter.on(InternalFightEvents.End, (fightResult: { winner: Player; loser: Player }) => {
            this.globalEmitter.emit(InternalFightEvents.End, { accessCode: this.accessCode, winner: fightResult.winner, loser: fightResult.loser });
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

    addPlayer(player: Player): void {
        this.generateUniquePlayerName(player);
        this.game.addPlayer(player);
        if (this.game.isGameFull()) {
            this.isLocked = true;
        }
    }

    expelPlayer(playerId: string): void {
        this.game.removePlayer(playerId, this.playerBanMessage);
        this.globalEmitter.emit(InternalRoomEvents.PlayersUpdated, { accessCode: this.accessCode, players: this.getPlayers() });
    }

    removePlayer(playerId: string): void {
        if (this.game.hasStarted) {
            this.removePlayerFromGame(playerId);
        } else {
            this.removePlayerFromLobby(playerId);
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

    private removePlayerFromLobby(playerId: string): void {
        if (this.isPlayerAdmin(playerId)) {
            for (const player of this.getPlayers().filter((p) => p.id !== playerId)) {
                this.game.removePlayer(player.id, this.adminDisconnectMessage);
            }
            this.game.removePlayer(playerId, this.confirmDisconnectMessage);
            this.globalEmitter.emit(InternalRoomEvents.CloseRoom, this.accessCode);
        } else {
            this.game.removePlayer(playerId, this.confirmDisconnectMessage);
            this.globalEmitter.emit(InternalRoomEvents.PlayersUpdated, { accessCode: this.accessCode, players: this.getPlayers() });
        }
    }

    private removePlayerFromGame(playerId: string): void {
        this.game.removePlayerOnMap(playerId);
        this.game.removePlayer(playerId, this.confirmDisconnectMessage);

        if (this.game.players.length < 2) {
            const lastPlayer = this.getPlayers()[0];
            this.game.removePlayer(lastPlayer.id, this.notEnoughPlayersMessage);
            this.globalEmitter.emit(InternalRoomEvents.CloseRoom, this.accessCode);
            return;
        }
        this.globalEmitter.emit(InternalRoomEvents.PlayersUpdated, { accessCode: this.accessCode, players: this.getPlayers() });
        if (this.isPlayerAdmin(playerId) && this.game.isDebugMode) {
            this.game.isDebugMode = false;
            this.globalEmitter.emit(InternalGameEvents.DebugStateChanged, { accessCode: this.accessCode, newState: false });
        }

        if (this.game.isPlayerInFight(playerId)) {
            this.game.removePlayerFromFight(playerId);
        }

        if (this.game.isPlayerTurn(playerId)) {
            this.game.endTurn();
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
}
