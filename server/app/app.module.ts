import { CourseController } from '@app/controllers/course/course.controller';
import { DateController } from '@app/controllers/date/date.controller';
import { ExampleController } from '@app/controllers/example/example.controller';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { Board, boardSchema } from '@app/model/database/board';
import { CourseService } from '@app/services/course/course.service';
import { DateService } from '@app/services/date/date.service';
import { ExampleService } from '@app/services/example/example.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardController } from './controllers/board/board.controller';
import { Course, courseSchema } from './model/database/course';
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
        MongooseModule.forFeature([
            { name: Board.name, schema: boardSchema },
            { name: Course.name, schema: courseSchema },
        ]),
    ],
    controllers: [CourseController, DateController, ExampleController, BoardController],
    providers: [ChatGateway, CourseService, DateService, ExampleService, BoardService, Logger],
})
export class AppModule {}
