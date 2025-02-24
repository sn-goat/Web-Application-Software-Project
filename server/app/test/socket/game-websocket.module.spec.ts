import { GameWebSocketModule } from '@app/gateways/game-websocket.module';
import { GameGateway } from '@app/gateways/game.gateway';
import { GameService } from '@app/gateways/game.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('GameWebSocketModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [GameWebSocketModule],
    }).compile();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should provide the GameService', () => {
    const gameService = module.get<GameService>(GameService);
    expect(gameService).toBeInstanceOf(GameService);
  });

  it('should provide the GameGateway', () => {
    const gameGateway = module.get<GameGateway>(GameGateway);
    expect(gameGateway).toBeInstanceOf(GameGateway);
  });
});
