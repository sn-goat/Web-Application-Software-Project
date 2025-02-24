import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { Board, boardSchema } from '@app/model/database/board';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardController } from './controllers/board/board.controller';
import { BoardService } from './services/board/board.service';
import { GameGateway } from './game.gateway';
import { GameWebSocketModule } from './game-websocket.module';
import { GameService } from './game.service';

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
    ],
    controllers: [BoardController],
    providers: [ChatGateway, BoardService, Logger, GameWebSocketModule, GameService, GameGateway],
})
export class AppModule {}
