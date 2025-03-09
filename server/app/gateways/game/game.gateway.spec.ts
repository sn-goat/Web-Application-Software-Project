import { GameService } from '@app/services/game.service';
import { GameGateway } from './game.gateway';

describe('GameGateway', () => {
    let gateway: GameGateway;
    let gameService: GameService;
    beforeEach(() => {
        gateway = new GameGateway(gameService);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
});
