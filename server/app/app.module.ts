import { BoardController } from '@app/controllers/board/board.controller';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { GameGateway } from '@app/gateways/game/game.gateway';
import { RoomGateway } from '@app/gateways/room/room.gateway';
import { Board, boardSchema } from '@app/model/database/board';
import { BoardService } from '@app/services/board/board.service';
import { GameManagerService } from '@app/services/game/games-manager.service';
import { JournalService } from '@app/services/journal/journal.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'),
            }),
        }),
        MongooseModule.forFeature([{ name: Board.name, schema: boardSchema }]),
        EventEmitterModule.forRoot(),
    ],
    controllers: [BoardController],
    providers: [ChatGateway, BoardService, Logger, RoomGateway, GameGateway, GameManagerService, JournalService],
})
export class AppModule {}
