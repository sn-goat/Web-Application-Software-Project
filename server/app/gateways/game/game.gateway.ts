import { InternalEvents, InternalFightEvents, InternalGameEvents, InternalTimerEvents, InternalTurnEvents } from '@app/constants/internal-events';
import { THREE_SECONDS_IN_MS, TURN_DURATION_IN_S } from '@app/gateways/game/game.gateway.constants';
import { FightService } from '@app/services/fight/fight.service';
import { GameManagerService } from '@app/services/game/games-manager.service';
import { TimerService } from '@app/services/timer/timer.service';
import { Vec2 } from '@common/board';
import { Tile } from '@common/enums';
import { Fight, Game, MAX_FIGHT_WINS, PathInfo } from '@common/game';
import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
import { PlayerStats } from '@common/player';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger(GameGateway.name);

    constructor(
        private readonly gameManager: GameManagerService,
        private readonly timerService: TimerService,
        private readonly fightService: FightService,
    ) {}

    @OnEvent(InternalTimerEvents.Update)
    handleTimerUpdate(payload: { roomId: string; remainingTime: number }) {
        const fight = this.fightService.getFight(payload.roomId);
        if (fight) {
            this.server.to(fight.player1.id).emit(FightEvents.UpdateTimer, payload.remainingTime);
            this.server.to(fight.player2.id).emit(FightEvents.UpdateTimer, payload.remainingTime);
        } else {
            this.server.to(payload.roomId).emit(TurnEvents.UpdateTimer, { remainingTime: payload.remainingTime });
        }
    }

    @OnEvent(InternalTimerEvents.End)
    handleTimerEnd(accessCode: string) {
        const fight = this.fightService.getFight(accessCode);
        if (fight) {
            this.fightService.playerAttack(accessCode, this.gameService.isGameDebugMode(accessCode));
        } else {
            this.gameService.endTurnRequested(accessCode);
        }
    }

    @OnEvent(InternalGameEvents.AssignSpawn)
    handleAssignSpawn(payload: { playerId: string; position: Vec2 }) {
        this.server.to(payload.playerId).emit(GameEvents.AssignSpawn, payload.position);
    }

    @OnEvent(InternalTurnEvents.Move)
    handleBroadcastMove(payload: { accessCode: string; previousPosition: Vec2; player: PlayerStats }) {
        this.logger.log('Moving player' + payload.player.name + 'to: ' + payload.previousPosition);
        this.server.to(payload.accessCode).emit(TurnEvents.BroadcastMove, { previousPosition: payload.previousPosition, player: payload.player });
    }

    @OnEvent(InternalTurnEvents.BroadcastDoor)
    sendDoorState(payload: { accessCode: string; position: Vec2; newState: Tile.OPENED_DOOR | Tile.CLOSED_DOOR }) {
        this.logger.log('Changing door state at position: ' + payload.position + ' to: ' + payload.newState);
        this.server.to(payload.accessCode).emit(TurnEvents.BroadcastDoor, { position: payload.position, newState: payload.newState });
    }

    @OnEvent(InternalTurnEvents.Update)
    handleUpdateTurn(turn: { player: PlayerStats; path: Record<string, PathInfo> }) {
        this.logger.log('Updating turn for player: ' + turn.player.name + turn.player.id);
        this.server.to(turn.player.id).emit(TurnEvents.UpdateTurn, turn);
    }

    @OnEvent(InternalTurnEvents.End)
    handleEndTurn(accessCode: string) {
        this.logger.log('Ending turn early');
        this.endTurn(accessCode);
    }

    @OnEvent(InternalFightEvents.Init)
    sendFightInit(fight: Fight) {
        this.logger.log('Initiating fight between ' + fight.player1.name + ' and ' + fight.player2.name);
        this.server.to(fight.player1.id).emit(FightEvents.Init, fight);
        this.server.to(fight.player2.id).emit(FightEvents.Init, fight);
    }

    @OnEvent(InternalFightEvents.SwitchTurn)
    sendFightSwitchTurn(accessCode: string) {
        const fight = this.fightService.getFight(accessCode);
        if (!fight) {
            this.logger.error('No active fight found for access code: ' + accessCode);
            return;
        } else {
            this.logger.log('Switching turn to player: ' + fight.currentPlayer.name);
            this.server.to(fight.player1.id).emit(FightEvents.SwitchTurn, fight);
            this.server.to(fight.player2.id).emit(FightEvents.SwitchTurn, fight);
        }
    }

    @OnEvent(InternalFightEvents.End)
    sendFightEnd(payload: { accessCode: string; winner?: PlayerStats; loser?: PlayerStats }) {
        const fight = this.fightService.getFight(payload.accessCode);
        if (!fight) {
            this.logger.error('No active fight found for access code: ' + payload.accessCode);
            return;
        }
        this.logger.log('Ending fight');
        if (payload.winner && payload.loser) {
            this.logger.log(`The winner is: ${payload.winner.name} and the loser is: ${payload.loser.name}`);
            this.gameService.incrementWins(payload.accessCode, payload.winner.id);
            if (payload.winner && this.gameService.getPlayer(payload.accessCode, payload.winner.id).wins >= MAX_FIGHT_WINS) {
                this.server.to(payload.accessCode).emit(GameEvents.End, payload.winner);
            }
            this.server.to(payload.accessCode).emit(FightEvents.Winner, this.gameService.getPlayer(payload.accessCode, payload.winner.id));
            this.server.to(payload.accessCode).emit(FightEvents.Loser, this.gameService.getPlayer(payload.accessCode, payload.loser.id));
            this.gameService.movePlayerToSpawn(payload.accessCode, this.gameService.getPlayer(payload.accessCode, payload.loser.id));
        }
        this.gameService.decrementAction(payload.accessCode, this.gameService.getPlayerTurn(payload.accessCode));
        this.server.to(fight.player1.id).emit(FightEvents.End);
        this.server.to(fight.player2.id).emit(FightEvents.End);
        if (payload.loser && this.gameService.getPlayerTurn(payload.accessCode).id === payload.loser.id) {
            this.endTurn(payload.accessCode);
        } else {
            this.timerService.resumeTimer(payload.accessCode);
            this.gameService.updatePlayerPathTurn(payload.accessCode, this.gameService.getPlayerTurn(payload.accessCode));
        }
    }

    @OnEvent(InternalEvents.PlayerRemoved)
    handlePlayerRemoved(payload: { accessCode: string; game: Game }) {
        this.logger.log('Player removed from game');
        this.server.to(payload.accessCode).emit(GameEvents.BroadcastQuitGame, payload.game);
    }

    @SubscribeMessage(GameEvents.Start)
    handleGameStart(client: Socket, accessCode: string) {
        let game = this.gameManager.getGame(accessCode);
        if (!game) {
            this.logger.error('Game not found for access code: ' + accessCode);
            return;
        }
        game = game.configureGame();
        this.server.to(accessCode).emit(GameEvents.GameStarted, game);
        this.startTurn(accessCode, game);
    }

    @SubscribeMessage(GameEvents.Debug)
    handleDebug(client: Socket, accessCode: string) {
        this.logger.log('Toggling debug mode');
        this.gameService.toggleDebugState(accessCode);
        this.server.to(accessCode).emit(GameEvents.BroadcastDebugState);
    }

    @SubscribeMessage(GameEvents.EndDebug)
    handleEndDebug(client: Socket, accessCode: string) {
        this.logger.log('End debug mode');
        this.gameService.endDebugMode(accessCode);
        this.server.to(accessCode).emit(GameEvents.BroadcastEndDebugState);
    }

    @SubscribeMessage(GameEvents.Ready)
    handleReady(client: Socket, payload: { accessCode: string; playerId: string }) {
        if (this.gameService.isActivePlayerReady(payload.accessCode, payload.playerId)) {
            this.startTurn(payload.accessCode);
        }
    }

    @SubscribeMessage(TurnEvents.ChangeDoorState)
    handleChangeDoorState(client: Socket, payload: { accessCode: string; position: Vec2; player: PlayerStats }) {
        this.gameService.changeDoorState(payload.accessCode, payload.position, payload.player);
    }

    @SubscribeMessage(TurnEvents.Move)
    handlePlayerMovement(client: Socket, payload: { accessCode: string; path: PathInfo; player: PlayerStats }) {
        this.logger.log('Player movement');
        this.gameService.processPath(payload.accessCode, payload.path, payload.player);
    }

    @SubscribeMessage(TurnEvents.DebugMove)
    debugPlayerMovement(client: Socket, payload: { accessCode: string; direction: Vec2; player: PlayerStats }) {
        this.gameService.movePlayer(payload.accessCode, payload.direction, payload.player);
        this.gameService.updatePlayerPathTurn(payload.accessCode, payload.player);
    }

    @SubscribeMessage(TurnEvents.End)
    handlePlayerEnd(client: Socket, accessCode: string) {
        this.endTurn(accessCode);
    }

    @SubscribeMessage(FightEvents.Init)
    handleFightInit(client: Socket, payload: { accessCode: string; player1: string; player2: string }) {
        const player1 = this.gameService.getPlayer(payload.accessCode, payload.player1);
        const player2 = this.gameService.getPlayer(payload.accessCode, payload.player2);
        this.logger.log('Initiating fight between ' + player1 + ' and ' + player2);
        this.logger.log('Access code: ' + payload.accessCode);
        this.fightService.initFight(payload.accessCode, player1, player2);
    }

    @SubscribeMessage(FightEvents.Flee)
    handlePlayerFlee(client: Socket, accessCode: string) {
        this.logger.log('Player fleeing from ' + accessCode);
        this.fightService.playerFlee(accessCode);
    }

    @SubscribeMessage(FightEvents.Attack)
    handlePlayerAttack(client: Socket, accessCode: string) {
        this.fightService.playerAttack(accessCode, this.gameService.isGameDebugMode(accessCode));
    }

    afterInit(server: Server) {
        this.logger.log('GameGateway Initialized' + server);
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connecté : ${client.id}`);
        client.emit('welcome', { message: 'Bienvenue sur le serveur de jeu !' });
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client déconnecté : ${client.id}`);
    }
    private endTurn(accessCode: string) {
        this.logger.log('Ending turn');
        this.timerService.stopTimer(accessCode);
        this.server.to(accessCode).emit(TurnEvents.UpdateTimer, { remainingTime: 0 });
        this.server.to(accessCode).emit(TurnEvents.BroadcastEnd);
        this.gameService.switchTurn(accessCode);
        this.gameService.configureTurn(accessCode);
        this.startTurn(accessCode);
    }

    private startTurn(accessCode: string, game: Game) {
        const turn = game.configureTurn();
        this.logger.log(`Next player turn id: ${turn.player.id}`);
        this.server.to(accessCode).emit(TurnEvents.PlayerTurn, turn);
        setTimeout(() => {
            game.getTimer().startTimer(TURN_DURATION_IN_S);
            this.server.to(turn.player.id).emit(TurnEvents.Start, {});
        }, THREE_SECONDS_IN_MS);
    }
}
