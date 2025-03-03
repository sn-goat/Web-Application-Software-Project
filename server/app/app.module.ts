import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { Board, boardSchema } from '@app/model/database/board';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardController } from './controllers/board/board.controller';
import { GameWebSocketModule } from './gateways/game-websocket.module';
import { GameGateway } from './gateways/game.gateway';
import { GameService } from './gateways/game.service';
import { BoardService } from './services/board/board.service';

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
