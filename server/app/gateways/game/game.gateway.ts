import { Fight } from '@app/class/fight';
import { Cell, Vec2 } from '@common/board';
import { DoorState, MAX_FIGHT_WINS, PathInfo } from '@common/game';
import { Game } from '@app/class/game';
import { Player } from '@app/class/player';
import {
    InternalFightEvents,
    InternalGameEvents,
    InternalTimerEvents,
    InternalTurnEvents,
    InternalStatsEvents,
    InternalJournalEvents,
} from '@app/constants/internal-events';
import { GameManagerService } from '@app/services/game/games-manager.service';
import { Item } from '@common/enums';
import { FightEvents, GameEvents, TurnEvents, StatsEvents, JournalEvent } from '@common/game.gateway.events';
import { GameMessage, Entry } from '@common/journal';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Room } from '@app/class/room';
import { VirtualPlayer } from '@app/class/virtual-player';
import { FightResult, FightResultType } from '@app/constants/fight-interface';
import { Stats } from '@common/stats';

@WebSocketGateway({ cors: true })
@Injectable()
export class GameGateway {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger(GameGateway.name);

    constructor(private readonly gameManager: GameManagerService) {}

    @OnEvent(InternalTimerEvents.FightUpdate)
    handleFightTimerUpdate(payload: { accessCode: string; remainingTime: number }) {
        const fight: Fight = this.gameManager.getFight(payload.accessCode);
        this.server.to([fight.player1.id, fight.player2.id]).emit(FightEvents.UpdateTimer, payload.remainingTime);
    }

    @OnEvent(InternalTimerEvents.TurnUpdate)
    handleTurnTimerUpdate(payload: { accessCode: string; remainingTime: number }) {
        this.server.to(payload.accessCode).emit(TurnEvents.UpdateTimer, payload.remainingTime);
    }

    @OnEvent(InternalGameEvents.DebugStateChanged)
    handleDebugStateChange(payload: { accessCode: string; newState: boolean }) {
        this.server.to(payload.accessCode).emit(GameEvents.DebugStateChanged, payload.newState);
    }

    @OnEvent(InternalGameEvents.MapUpdated)
    handleMapUpdate(payload: { accessCode: string; map: Cell[][] }) {
        this.logger.log('Updating map');
        this.server.to(payload.accessCode).emit(GameEvents.MapUpdated, payload.map);
    }

    @OnEvent(InternalGameEvents.Winner)
    handleCtfWinner(payload: { accessCode: string; player: Player }) {
        const game = this.gameManager.getGame(payload.accessCode);
        this.logger.log(`Winner team : ${payload.player.team}`);
        this.server.to(payload.accessCode).emit(GameEvents.Winner, payload.player);
        game.dispatchGameStats();
    }

    @OnEvent(InternalTurnEvents.Move)
    handleBroadcastMove(payload: { accessCode: string; previousPosition: Vec2; player: Player }) {
        this.logger.log('Moving player' + payload.player.name + 'to: ' + payload.previousPosition);
        this.server.to(payload.accessCode).emit(TurnEvents.PlayerMoved, { previousPosition: payload.previousPosition, player: payload.player });
    }

    @OnEvent(InternalTurnEvents.DoorStateChanged)
    sendDoorState(payload: { accessCode: string; doorState: DoorState }) {
        this.logger.log('Changing door state at position: ' + payload.doorState.position + ' to: ' + payload.doorState.state);
        this.server.to(payload.accessCode).emit(TurnEvents.DoorStateChanged, payload.doorState);
    }

    @OnEvent(InternalTurnEvents.Update)
    handleUpdateTurn(turn: { player: Player; path: Record<string, PathInfo> }) {
        this.logger.log('Updating turn for player: ' + turn.player.name + turn.player.id);
        this.server.to(turn.player.id).emit(TurnEvents.UpdateTurn, turn);
    }

    @OnEvent(InternalTurnEvents.ChangeTurn)
    handleEndTurn(payload: { accessCode: string; player: Player; path: Record<string, PathInfo> }) {
        this.logger.log('Changing turn to player: ' + payload.player.name);
        this.server.to(payload.accessCode).emit(TurnEvents.PlayerTurn, { player: payload.player, path: payload.path });
    }

    @OnEvent(InternalFightEvents.Init)
    handleFightInitialized(fight: Fight) {
        this.logger.log('Fight initialized');
        if (!(fight.player1 instanceof VirtualPlayer)) {
            this.server.to(fight.player1.id).emit(FightEvents.Init, fight);
        }
        if (!(fight.player2 instanceof VirtualPlayer)) {
            this.server.to(fight.player2.id).emit(FightEvents.Init, fight);
        }
    }

    @OnEvent(InternalStatsEvents.DispatchStats)
    handleStats(payload: { accessCode: string; stats: Stats }) {
        this.logger.log('Dispatching stats for game: ' + payload.accessCode);
        this.server.to(payload.accessCode).emit(StatsEvents.StatsUpdate, payload.stats);
    }

    @OnEvent(InternalJournalEvents.Add)
    handleJournalEntry(payload: { accessCode: string; entry: Entry }) {
        this.logger.log('Dispatching journal entry: ' + payload.entry.message);
        if (payload.entry.isFight) {
            this.server.to(payload.entry.playersInvolved[0]).emit(JournalEvent.Add, payload.entry);
            this.server.to(payload.entry.playersInvolved[1]).emit(JournalEvent.Add, payload.entry);
        } else {
            this.server.to(payload.accessCode).emit(JournalEvent.Add, payload.entry);
        }
    }

    @OnEvent(InternalFightEvents.ChangeFighter)
    changeFighter(fight: Fight) {
        this.logger.log(`Changing fighter ${fight.currentPlayer.name}`);
        if (!(fight.player1 instanceof VirtualPlayer)) {
            this.server.to(fight.player1.id).emit(FightEvents.ChangeFighter, fight);
        }
        if (!(fight.player2 instanceof VirtualPlayer)) {
            this.server.to(fight.player2.id).emit(FightEvents.ChangeFighter, fight);
        }
    }

    @OnEvent(InternalFightEvents.End)
    manageEndFight(payload: { accessCode: string; fightResult: FightResult }) {
        const game: Game = this.gameManager.getGame(payload.accessCode);
        if (payload.fightResult.type === FightResultType.Tie) {
            this.server.to(payload.accessCode).emit(FightEvents.End, null);
            game.timer.resumeTimer();
            return;
        }
        if (!(payload.fightResult.winner instanceof VirtualPlayer)) {
            this.server.to(payload.fightResult.winner.id).emit(FightEvents.Winner, payload.fightResult.winner);
        }
        if (!(payload.fightResult.loser instanceof VirtualPlayer)) {
            this.server.to(payload.fightResult.loser.id).emit(FightEvents.Loser, payload.fightResult.loser);
        }

        this.server.to(payload.accessCode).emit(FightEvents.End, game.players);
        if (!game.isCTF && payload.fightResult.winner.wins >= MAX_FIGHT_WINS) {
            this.server.to(payload.accessCode).emit(GameEvents.Winner, payload.fightResult.winner);
            game.dispatchGameStats();

            const playerWithoutWinner = game.players.filter((player) => player.id !== payload.fightResult.winner.id);
            game.dispatchJournalEntry(GameMessage.EndGame, [payload.fightResult.winner, ...playerWithoutWinner]);
        }
    }

    @OnEvent(InternalTurnEvents.Start)
    handleStartTurn(playerId: string) {
        this.logger.log('Starting turn for player');
        this.server.to(playerId).emit(TurnEvents.Start, {});
    }

    @OnEvent(InternalTurnEvents.ItemCollected)
    handleItemCollected(payload: { accessCode: string; player: Player; position: Vec2 }) {
        this.logger.log(`Player ${payload.player.name} collected item`);
        this.server.to(payload.accessCode).emit(TurnEvents.BroadcastItem, {
            player: payload.player,
            position: payload.position,
        });
    }

    @OnEvent(InternalTurnEvents.InventoryFull)
    handleInventoryFull(payload: { accessCode: string; player: Player; item: Item; position: Vec2 }) {
        this.logger.log(`Player ${payload.player.name} inventory is full`);
        this.server.to(payload.accessCode).emit(TurnEvents.InventoryFull, {
            player: payload.player,
            item: payload.item,
            position: payload.position,
        });
    }

    @OnEvent(InternalTurnEvents.DroppedItem)
    handleDroppedItem(payload: { accessCode: string; player: Player; droppedItems: { item: Item; position: Vec2 }[] }) {
        this.logger.log(`Player ${payload.player.name} dropped ${payload.droppedItems.length} items`);
        this.server.to(payload.accessCode).emit(TurnEvents.DroppedItem, {
            player: payload.player,
            droppedItems: payload.droppedItems,
        });
    }

    @SubscribeMessage(GameEvents.Start)
    handleGameStart(client: Socket, accessCode: string) {
        let game: Game = this.gameManager.getGame(accessCode);
        if (!game) {
            this.logger.error('Game not found for access code: ' + accessCode);
            return;
        }
        game = game.configureGame();
        if (game) {
            this.server.to(accessCode).emit(GameEvents.GameStarted, game);
        } else {
            this.logger.log('Game could not be configured for access code: ' + accessCode);
            client.emit(GameEvents.Error, 'Il vous faut un nombre de joueurs pair pour commencer la partie.');
        }
    }

    @SubscribeMessage(GameEvents.Ready)
    handleReady(client: Socket, payload: { accessCode: string; playerId: string }) {
        const room: Room = this.gameManager.getRoom(payload.accessCode);
        if (room.isPlayerAdmin(payload.playerId)) {
            room.game.startTurn();
        }
    }

    @SubscribeMessage(GameEvents.Debug)
    handleDebug(client: Socket, accessCode: string) {
        const game: Game = this.gameManager.getGame(accessCode);
        if (game) {
            this.logger.log('Toggling debug mode');
            const newDebugState = game.toggleDebug();
            this.server.to(accessCode).emit(GameEvents.DebugStateChanged, newDebugState);
        }
    }

    @SubscribeMessage(TurnEvents.Move)
    handlePlayerMovement(client: Socket, payload: { accessCode: string; path: PathInfo; playerId: string }) {
        this.logger.log('Player movement');
        const game: Game = this.gameManager.getGame(payload.accessCode);
        game.processPath(payload.path, payload.playerId);
    }

    @SubscribeMessage(TurnEvents.DebugMove)
    debugPlayerMovement(client: Socket, payload: { accessCode: string; direction: Vec2; playerId: string }) {
        const game: Game = this.gameManager.getGame(payload.accessCode);
        game.movePlayerDebug(payload.direction, payload.playerId);
    }

    @SubscribeMessage(TurnEvents.ChangeDoorState)
    handleChangeDoorState(client: Socket, payload: { accessCode: string; doorPosition: Vec2; playerId: string }) {
        const game: Game = this.gameManager.getGame(payload.accessCode);
        game.changeDoorState(payload.doorPosition, payload.playerId);
    }

    @SubscribeMessage(TurnEvents.End)
    handlePlayerEnd(client: Socket, accessCode: string) {
        const game: Game = this.gameManager.getGame(accessCode);
        game.endTurn();
    }

    @SubscribeMessage(FightEvents.Init)
    handleFightInit(client: Socket, payload: { accessCode: string; playerInitiatorId: string; playerDefenderId: string }) {
        this.logger.log('Initiating fight');
        const game: Game = this.gameManager.getGame(payload.accessCode);
        game.initFight(payload.playerInitiatorId, payload.playerDefenderId);
    }

    @SubscribeMessage(FightEvents.Flee)
    handlePlayerFlee(client: Socket, accessCode: string) {
        this.logger.log('Player fleeing from ' + accessCode);
        const game: Game = this.gameManager.getGame(accessCode);
        game.flee();
    }

    @SubscribeMessage(FightEvents.Attack)
    handlePlayerAttack(client: Socket, accessCode: string) {
        this.logger.log('Player attack from ' + accessCode);
        const game: Game = this.gameManager.getGame(accessCode);
        game.playerAttack();
    }

    @SubscribeMessage(TurnEvents.InventoryChoice)
    handleInventoryChoice(
        client: Socket,
        payload: { playerId: string; itemToThrow: Item; itemToAdd: Item; position: Vec2; accessCode: string },
    ): void {
        const game: Game = this.gameManager.getGame(payload.accessCode);
        if (!game) return;

        const player = game.getPlayerById(payload.playerId);
        if (player) {
            player.removeItemFromInventory(payload.itemToThrow);
            player.addItemToInventory(payload.itemToAdd);
            game.inventoryFull = false;
            game.map[payload.position.y][payload.position.x].item = payload.itemToThrow;
            this.server.to(payload.accessCode).emit(TurnEvents.MapUpdate, {
                player,
                item: payload.itemToThrow,
                position: payload.position,
            });

            if (game.pendingEndTurn) {
                game.endTurn();
            }
        }
    }
}
