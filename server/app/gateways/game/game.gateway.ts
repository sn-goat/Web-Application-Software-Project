import { THREE_SECONDS_IN_MS, TimerEvents } from '@app/gateways/game/game.gateway.constants';
import { FightService } from '@app/services/fight.service';
import { GameService } from '@app/services/game.service';
import { TimerService } from '@app/services/timer/timer.service';
import { Vec2 } from '@common/board';
import { Tile } from '@common/enums';
import { PathInfo, Fight } from '@common/game';
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
        private readonly gameService: GameService,
        private readonly timerService: TimerService,
        private readonly fightService: FightService,
    ) {}

    @OnEvent(TimerEvents.Update)
    handleTimerUpdate(payload: { roomId: string; remainingTime: number }) {
        const fight = this.fightService.getFight(payload.roomId);
        if (fight) {
            this.server.to(fight.player1.id).emit(FightEvents.UpdateTimer, payload.remainingTime);
            this.server.to(fight.player2.id).emit(FightEvents.UpdateTimer, payload.remainingTime);
        } else {
            this.server.to(payload.roomId).emit(TurnEvents.UpdateTimer, { remainingTime: payload.remainingTime });
        }
        // this.logger.log(`Timer Update for room ${payload.roomId}: ${payload.remainingTime} seconds left.`);
    }

    @OnEvent(TimerEvents.End)
    handleTimerEnd(roomId: string) {
        const fight = this.fightService.getFight(roomId);
        if (fight) {
            this.fightService.nextTurn(roomId);
        } else {
            this.gameService.endTurnRequested(roomId);
        }
    }

    @OnEvent(GameEvents.AssignSpawn)
    handleAssignSpawn(payload: { playerId: string; position: Vec2 }) {
        this.server.to(payload.playerId).emit(GameEvents.AssignSpawn, payload.position);
    }

    @OnEvent(TurnEvents.Move)
    handleBroadcastMove(payload: { accessCode: string; previousPosition: Vec2; player: PlayerStats }) {
        this.logger.log('Moving player' + payload.player.name + 'to: ' + payload.previousPosition);
        this.server.to(payload.accessCode).emit(TurnEvents.BroadcastMove, { previousPosition: payload.previousPosition, player: payload.player });
    }

    @OnEvent(TurnEvents.BroadcastDoor)
    sendDoorState(payload: { accessCode: string; position: Vec2; newState: Tile.OPENED_DOOR | Tile.CLOSED_DOOR }) {
        this.logger.log('Changing door state at position: ' + payload.position + ' to: ' + payload.newState);
        this.server.to(payload.accessCode).emit(TurnEvents.BroadcastDoor, { position: payload.position, newState: payload.newState });
    }

    @OnEvent(TurnEvents.UpdateTurn)
    handleUpdateTurn(turn: { player: PlayerStats; path: Record<string, PathInfo> }) {
        this.logger.log('Updating turn for player: ' + turn.player.id);
        this.server.to(turn.player.id).emit(TurnEvents.UpdateTurn, turn);
    }

    @OnEvent(TurnEvents.End)
    handleEndTurn(accessCode: string) {
        this.logger.log('Ending turn early');
        this.endTurn(accessCode);
    }

    @OnEvent(FightEvents.Init)
    sendFightInit(fight: Fight) {
        this.logger.log('Initiating fight between ' + fight.player1.name + ' and ' + fight.player2.name);
        this.server.to(fight.player1.id).emit(FightEvents.Init, fight);
        this.server.to(fight.player2.id).emit(FightEvents.Init, fight);
    }

    @OnEvent(FightEvents.SwitchTurn)
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

    @OnEvent(FightEvents.End)
    sendFightEnd(payload: { accessCode: string; winner?: PlayerStats; loser?: PlayerStats }) {
        const fight = this.fightService.getFight(payload.accessCode);
        if (!fight) {
            this.logger.error('No active fight found for access code: ' + payload.accessCode);
            return;
        }
        this.logger.log('Ending fight');
        if (payload.winner && payload.loser) {
            this.server.to(payload.winner.id).emit(FightEvents.Winner);
            this.server.to(payload.loser.id).emit(FightEvents.Loser);
            this.gameService.movePlayer(payload.accessCode, payload.loser.spawnPosition, payload.loser);
            this.gameService.decrementAction(payload.accessCode, this.gameService.getPlayerTurn(payload.accessCode));
        }
        this.server.to(fight.player1.id).emit(FightEvents.End);
        this.server.to(fight.player2.id).emit(FightEvents.End);
        this.timerService.resumeTimer(payload.accessCode);
    }

    @SubscribeMessage(GameEvents.Create)
    handleGameCreation(client: Socket, payload: { accessCode: string; mapName: string; organizerId: string }) {
        this.gameService.createGame(payload.accessCode, payload.organizerId, payload.mapName);
    }

    @SubscribeMessage(GameEvents.Configure)
    async handleGameConfigure(client: Socket, payload: { accessCode: string; players: PlayerStats[] }) {
        const game = await this.gameService.configureGame(payload.accessCode, payload.players);
        this.logger.log('Game configured');
        this.server.to(payload.accessCode).emit(GameEvents.BroadcastStartGame, game);
        this.logger.log('Game started');
    }

    @SubscribeMessage(GameEvents.Debug)
    handleDebug(client: Socket, accessCode: string) {
        this.logger.log('Toggling debug mode');
        this.gameService.toggleDebugState(accessCode);
        this.server.to(accessCode).emit(GameEvents.BroadcastDebugState);
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

    @SubscribeMessage(GameEvents.Quit)
    async handleGameQuit(client: Socket, payload: { accessCode: string; playerId: string }) {
        const game = await this.gameService.quitGame(payload.accessCode, payload.playerId);
        this.server.to(payload.accessCode).emit(GameEvents.BroadcastQuitGame, { game: game.game, lastPlayer: game.lastPlayer });
    }

    @SubscribeMessage(GameEvents.Quit)
    async handleGameQuit(client: Socket, payload: { accessCode: string; playerId: string }) {
        const game = await this.gameService.quitGame(payload.accessCode, payload.playerId);
        this.server.to(payload.accessCode).emit(GameEvents.BroadcastQuitGame, { game: game.game, lastPlayer: game.lastPlayer });
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
    handleFightInit(client: Socket, payload: { accessCode: string; player1: PlayerStats; player2: PlayerStats }) {
        this.logger.log('Initiating fight between ' + payload.player1.name + ' and ' + payload.player2.name);
        this.logger.log('Access code: ' + payload.accessCode);
        this.fightService.initFight(payload.accessCode, payload.player1, payload.player2);
        // switch the positions for the defender render
        this.server.to(payload.player2.id).emit(FightEvents.Init, { player1: payload.player1, player2: payload.player2 });
    }

    @SubscribeMessage(FightEvents.Flee)
    handlePlayerFlee(client: Socket, accessCode: string) {
        this.logger.log('Player fleeing from ' + accessCode);
        this.fightService.playerFlee(accessCode);
    }

    @SubscribeMessage(FightEvents.Attack)
    handlePlayerAttack(client: Socket, accessCode: string) {
        this.fightService.playerAttack(accessCode);
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

    private startTurn(accessCode: string) {
        this.logger.log('Starting turn');
        const turn = this.gameService.configureTurn(accessCode);
        this.logger.log(`Next player turn id: ${turn.player.id}`);
        this.server.to(accessCode).emit(TurnEvents.PlayerTurn, turn);
        setTimeout(() => {
            this.gameService.startTimer(accessCode);
        }, THREE_SECONDS_IN_MS);
    }
}
