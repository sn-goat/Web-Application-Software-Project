import { GameService } from '@app/services/game.service';
import { Vec2 } from '@common/board';
import { GameEvents, TurnEvents } from '@common/game.gateway.events';
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

    constructor(private readonly gameService: GameService) {}

    @OnEvent('timerUpdate')
    handleTimerUpdate(payload: { roomId: string; remainingTime: number }) {
        this.logger.log(`Timer Update for room ${payload.roomId}: ${payload.remainingTime} seconds left.`);
        this.server.to(payload.roomId).emit(TurnEvents.UpdateTimer, { remainingTime: payload.remainingTime });
    }

    @OnEvent('timerEnded')
    handleTimerEnd(payload: { roomId: string }) {
        this.logger.log(`Timer ended in room: ${payload.roomId}`);
        this.server.to(payload.roomId).emit(TurnEvents.End);
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
        this.server.to(payload.accessCode).emit(GameEvents.BroadcastStartGame, { game });
        this.logger.log('Game started');
        this.logger.log('Turn Configuration');
        const turnInfo = this.gameService.configureTurn(payload.accessCode);
        this.server.to(payload.accessCode).emit(TurnEvents.Start, { turnInfo });
        this.logger.log('Turn Configured');
    }

    @SubscribeMessage(GameEvents.Debug)
    handleDebug(client: Socket, payload: { accessCode: string }) {
        const isDebugMode = this.gameService.changeDebugState(payload.accessCode);
        this.server.to(payload.accessCode).emit(GameEvents.BroadcastDebugState, { isDebugMode });
    }

    @SubscribeMessage(GameEvents.Ready)
    handleReady(client: Socket, payload: { accessCode: string; playerId: string }) {
        if (this.gameService.isGameAdmin(payload.accessCode, payload.playerId)) {
            this.startTurn(payload);
        }
    }

    @SubscribeMessage(TurnEvents.ChangeDoorState)
    handleChangeDoorState(client: Socket, payload: { accessCode: string; position: Vec2 }) {
        const newState = this.gameService.changeDoorState(payload.accessCode, payload.position);
        this.server.to(payload.accessCode).emit(TurnEvents.BroadcastDoor, { position: payload.position, newState });
    }

    @SubscribeMessage(TurnEvents.Move)
    handlePlayerMovement(client: Socket, payload: { accessCode: string; direction: Vec2 }) {
        this.gameService.movePlayer(payload.accessCode, payload.direction);
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

    private startTurn(payload: { accessCode: string; playerId: string }) {
        const playerTurnId = this.gameService.getPlayerTurn(payload.accessCode);
        this.logger.log(`Next player turn id: ${playerTurnId}`);
        this.server.to(payload.accessCode).emit(TurnEvents.PlayerTurn, { playerTurnId });
        setTimeout(() => {
            this.gameService.startTurn(payload.accessCode);
        }, 3000);
    }
}
