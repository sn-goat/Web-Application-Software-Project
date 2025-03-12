import { GameService } from '@app/services/game.service';
import { TimerService } from '@app/services/timer/timer.service';
import { Vec2 } from '@common/board';
import { GameEvents, TurnEvents } from '@common/game.gateway.events';
import { TimerEvents, THREE_SECONDS_IN_MS } from '@app/gateways/game/game.gateway.constants';
import { PlayerStats } from '@common/player';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PathInfo, TurnInfo } from '@common/game';

@WebSocketGateway({ cors: true })
@Injectable()
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger(GameGateway.name);

    constructor(
        private readonly gameService: GameService,
        private readonly timerService: TimerService,
    ) {}

    @OnEvent(TimerEvents.Update)
    handleTimerUpdate(payload: { roomId: string; remainingTime: number }) {
        // this.logger.log(`Timer Update for room ${payload.roomId}: ${payload.remainingTime} seconds left.`);
        this.server.to(payload.roomId).emit(TurnEvents.UpdateTimer, { remainingTime: payload.remainingTime });
    }

    @OnEvent(TimerEvents.End)
    handleTimerEnd(accessCode: string) {
        this.logger.log(`Timer ended in room: ${accessCode}`);
        this.endTurn(accessCode);
    }

    @OnEvent(TurnEvents.Move)
    handleBroadcastMove(payload: { accessCode: string; position: Vec2; direction: Vec2 }) {
        this.server.to(payload.accessCode).emit(TurnEvents.BroadcastMove, { position: payload.position, direction: payload.direction });
    }

    @OnEvent(TurnEvents.UpdateTurn)
    handleUpdateTurn(turn: TurnInfo) {
        this.logger.log('Updating turn for player: ' + turn.player.id);
        this.server.to(turn.player.id).emit(TurnEvents.UpdateTurn, turn);
    }

    @OnEvent(TurnEvents.End)
    handleEndTurn(accessCode: string) {
        this.logger.log('Ending turn early');
        this.endTurn(accessCode);
    }

    @SubscribeMessage(GameEvents.Create)
    handleGameCreation(client: Socket, payload: { accessCode: string; mapName: string; organizerId: string }) {
        this.logger.log('Creating game with payload: ' + payload.organizerId);
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
    handleDebug(client: Socket, payload: { accessCode: string }) {
        const isDebugMode = this.gameService.changeDebugState(payload.accessCode);
        this.server.to(payload.accessCode).emit(GameEvents.BroadcastDebugState, { isDebugMode });
    }

    @SubscribeMessage(GameEvents.Ready)
    handleReady(client: Socket, payload: { accessCode: string; playerId: string }) {
        if (this.gameService.isActivePlayerReady(payload.accessCode, payload.playerId)) {
            this.startTurn(payload.accessCode);
        }
    }

    @SubscribeMessage(TurnEvents.ChangeDoorState)
    handleChangeDoorState(client: Socket, payload: { accessCode: string; position: Vec2 }) {
        const newState = this.gameService.changeDoorState(payload.accessCode, payload.position);
        this.server.to(payload.accessCode).emit(TurnEvents.BroadcastDoor, { position: payload.position, newState });
    }

    @SubscribeMessage(TurnEvents.Move)
    handlePlayerMovement(client: Socket, payload: { accessCode: string; path: PathInfo }) {
        this.logger.log('Player movement');
        this.gameService.processPath(payload.accessCode, payload.path);
    }

    @SubscribeMessage(TurnEvents.End)
    handlePlayerEnd(client: Socket, accessCode: string) {
        this.endTurn(accessCode);
    }

    // @SubscribeMessage(FightEvents.Init)
    // handleFightInit(client: Socket, payload: { accessCode: string; playerId: string; enemyPosition: Vec2 }) {
    //     this.gameService.initFight(payload.accessCode, payload.playerId, payload.enemyPosition);
    // }

    // @SubscribeMessage(FightEvents.Flee)
    // handlePlayerFlee(client: Socket, payload: { accessCode: string; playerId: string }) {
    //     this.gameService.playerFlee(payload.accessCode, payload.playerId);
    // }

    // @SubscribeMessage(FightEvents.Attack)
    // handlePlayerAttack(client: Socket, payload: { accessCode: string; playerId: string }) {
    //     this.gameService.playerAttack(payload.accessCode, payload.playerId);
    // }

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
