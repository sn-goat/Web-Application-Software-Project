import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { Board, boardSchema } from '@app/model/database/board';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardController } from './controllers/board/board.controller';
import { GameGateway } from './gateways/game/game.gateway';
import { RoomGateway } from './gateways/room/room.gateway';
import { BoardService } from './services/board/board.service';
import { GameService } from './services/game.service';
import { RoomService } from './services/room.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'), // Loaded from .env
            }),
        }),
        MongooseModule.forFeature([{ name: Board.name, schema: boardSchema }]),
        EventEmitterModule.forRoot(),
    ],
    controllers: [BoardController],
    providers: [ChatGateway, BoardService, Logger, RoomService, RoomGateway, GameService, GameGateway],
})
export class AppModule {}
