import { Fight } from '@app/class/fight';
import { Game } from '@app/class/game';
import { Player } from '@app/class/player';
import { InternalFightEvents, InternalGameEvents, InternalTimerEvents, InternalTurnEvents } from '@app/constants/internal-events';
import { GameManagerService } from '@app/services/game/games-manager.service';
import { Vec2 } from '@common/board';
import { Tile } from '@common/enums';
import { MAX_FIGHT_WINS, PathInfo } from '@common/game';
import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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

    @OnEvent(InternalTurnEvents.Move)
    handleBroadcastMove(payload: { accessCode: string; previousPosition: Vec2; player: Player }) {
        this.logger.log('Moving player' + payload.player.name + 'to: ' + payload.previousPosition);
        this.server.to(payload.accessCode).emit(TurnEvents.PlayerMoved, { previousPosition: payload.previousPosition, player: payload.player });
    }

    @OnEvent(InternalTurnEvents.BroadcastDoor)
    sendDoorState(payload: { accessCode: string; position: Vec2; newState: Tile.OPENED_DOOR | Tile.CLOSED_DOOR }) {
        this.logger.log('Changing door state at position: ' + payload.position + ' to: ' + payload.newState);
        this.server.to(payload.accessCode).emit(TurnEvents.DoorStateChanged, { position: payload.position, newState: payload.newState });
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

    @OnEvent(InternalFightEvents.ChangeFighter)
    changeFighter(fight: Fight) {
        this.logger.log('Switching turn to player: ' + fight.currentPlayer.name);
        this.server.to(fight.player1.id).emit(FightEvents.ChangeFighter, fight);
        this.server.to(fight.player2.id).emit(FightEvents.ChangeFighter, fight);
    }

    @OnEvent(InternalFightEvents.End)
    manageEndFight(payload: { accessCode: string; winner: Player; loser: Player }) {
        const game: Game = this.gameManager.getGame(payload.accessCode);
        this.server.to(payload.winner.id).emit(FightEvents.Winner, payload.winner);
        this.server.to(payload.loser.id).emit(FightEvents.Loser, payload.loser);
        this.server.to(payload.accessCode).emit(FightEvents.End, game.players);
        if (payload.winner.wins >= MAX_FIGHT_WINS) {
            this.server.to(payload.accessCode).emit(GameEvents.GameEnded, payload.winner);
            this.gameManager.closeRoom(payload.accessCode);
        } else if (game.isPlayerTurn(payload.loser.id)) {
            game.endTurn();
        } else {
            game.timer.resumeTimer();
            game.decrementAction(payload.winner);
        }
    }

    @OnEvent(InternalTurnEvents.Start)
    handleStartTurn(playerId: string) {
        this.logger.log('Starting turn for player');
        this.server.to(playerId).emit(TurnEvents.Start, {});
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
            game.startTurn();
        } else {
            this.logger.error('Game could not be configured for access code: ' + accessCode);
            client.emit(GameEvents.Error, 'Il vous faut un nombre de joueurs pair pour commencer la partie.');
        }
    }

    @SubscribeMessage(GameEvents.Ready)
    handleReady(client: Socket, payload: { accessCode: string; playerId: string }) {
        const game: Game = this.gameManager.getGame(payload.accessCode);
        if (game && game.isPlayerTurn(payload.playerId)) {
            game.startTurn();
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
        if (game.isDebugMode) {
            game.movePlayerDebug(payload.direction, payload.playerId);
        }
    }

    @SubscribeMessage(TurnEvents.ChangeDoorState)
    handleChangeDoorState(client: Socket, payload: { accessCode: string; doorPosition: Vec2; playerId: string }) {
        const game: Game = this.gameManager.getGame(payload.accessCode);
        const sendingInfo = game.changeDoorState(payload.doorPosition, payload.playerId);
        this.server
            .to(payload.accessCode)
            .emit(TurnEvents.DoorStateChanged, { doorPosition: sendingInfo.doorPosition, newDoorState: sendingInfo.newDoorState });
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
        const fight: Fight = game.initFight(payload.playerInitiatorId, payload.playerDefenderId);
        this.server.to([fight.player1.id, fight.player2.id]).emit(FightEvents.Init, fight);
    }

    @SubscribeMessage(FightEvents.Flee)
    handlePlayerFlee(client: Socket, accessCode: string) {
        this.logger.log('Player fleeing from ' + accessCode);
        const game: Game = this.gameManager.getGame(accessCode);
        if (game.flee()) {
            this.server.to([game.fight.player1.id, game.fight.player2.id]).emit(FightEvents.End, null);
            game.endFight();
        } else {
            const fight: Fight = game.changeFighter();
            this.server.to([fight.player1.id, fight.player2.id]).emit(FightEvents.ChangeFighter, fight);
        }
    }

    @SubscribeMessage(FightEvents.Attack)
    handlePlayerAttack(client: Socket, accessCode: string) {
        this.logger.log('Player attack from ' + accessCode);
        const game: Game = this.gameManager.getGame(accessCode);
        game.playerAttack();
    }
}
