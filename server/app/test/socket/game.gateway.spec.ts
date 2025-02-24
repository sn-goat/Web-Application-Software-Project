import { GameGateway } from '@app/gateways/game.gateway';
import { GameRoom, GameService, Player } from '@app/gateways/game.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';

describe('GameGateway', () => {
  let gateway: GameGateway;
  let gameService: Partial<GameService>;
  let mockServer: Partial<Server>;

  beforeEach(async () => {
    // Create a mock GameService with jest.fn() implementations
    const gameServiceMock = {
      createGame: jest.fn().mockReturnValue({ accessCode: '12345' } as GameRoom),
      joinGame: jest.fn().mockImplementation((accessCode: string, player: Player) =>
        accessCode === '12345'
          ? { accessCode, players: [player] } as GameRoom
          : null
      ),
      lockRoom: jest.fn().mockImplementation((accessCode: string) =>
        accessCode === '12345'
          ? { accessCode, locked: true } as GameRoom
          : null
      ),
      unlockRoom: jest.fn().mockImplementation((accessCode: string) =>
        accessCode === '12345'
          ? { accessCode, locked: false } as GameRoom
          : null
      ),
      startGame: jest.fn().mockImplementation((accessCode: string) =>
        accessCode === '12345'
          ? { accessCode, started: true } as GameRoom
          : null
      ),
      submitMove: jest.fn().mockImplementation((accessCode: string, playerId: string, move: string) =>
        accessCode === '12345'
          ? { accessCode, move } as GameRoom
          : null
      ),
    };

    // Create a TestingModule providing the gateway and the mocked game service.
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        { provide: GameService, useValue: gameServiceMock },
      ],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
    gameService = module.get<GameService>(GameService);

    // Create a mock Server with jest.fn() for 'to' and 'emit'
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    gateway.server = mockServer as Server;
  });

  describe('handleCreateGame', () => {
    it('should create a game, join client to room, and emit "gameCreated"', () => {
      const client = {
        join: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;

      gateway.handleCreateGame(client, { organizerId: 'org1' });

      expect(gameService.createGame).toHaveBeenCalledWith('org1');
      expect(client.join).toHaveBeenCalledWith('12345');
      expect(client.emit).toHaveBeenCalledWith('gameCreated', { accessCode: '12345' });
    });
  });

  describe('handleJoinGame', () => {
    it('should join game and emit "playerJoined" when room is found', () => {
      const client = {
        join: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;
      const player = { id: 'player1' } as Player;

      // Return a valid room for accessCode '12345'
      (gameService.joinGame as jest.Mock).mockReturnValueOnce({ accessCode: '12345', players: [player] } as GameRoom);

      gateway.handleJoinGame(client, { accessCode: '12345', player });

      expect(gameService.joinGame).toHaveBeenCalledWith('12345', player);
      expect(client.join).toHaveBeenCalledWith('12345');
      expect(mockServer.to).toHaveBeenCalledWith('12345');
      expect(mockServer.emit).toHaveBeenCalledWith('playerJoined', {
        player,
        room: { accessCode: '12345', players: [player] },
      });
    });

    it('should emit "joinError" if room is not found', () => {
      const client = {
        join: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;
      const player = { id: 'player1' } as Player;

      (gameService.joinGame as jest.Mock).mockReturnValueOnce(null);

      gateway.handleJoinGame(client, { accessCode: 'invalid', player });

      expect(gameService.joinGame).toHaveBeenCalledWith('invalid', player);
      expect(client.emit).toHaveBeenCalledWith('joinError', {
        message: 'Unable to join room. It may be locked or does not exist.',
      });
    });
  });

  describe('handleLockRoom', () => {
    it('should lock the room and emit "roomLocked"', () => {
      const client = {
        emit: jest.fn(),
      } as unknown as Socket;

      (gameService.lockRoom as jest.Mock).mockReturnValueOnce({ accessCode: '12345', locked: true, organizerId: 'org1', players: [], isLocked: true } as GameRoom);

      gateway.handleLockRoom(client, { accessCode: '12345' });

      expect(gameService.lockRoom).toHaveBeenCalledWith('12345');
      expect(mockServer.to).toHaveBeenCalledWith('12345');
      expect(mockServer.emit).toHaveBeenCalledWith('roomLocked', {
        room: { accessCode: '12345', locked: true },
      });
    });

    it('should emit "lockError" if room is not found', () => {
      const client = {
        emit: jest.fn(),
      } as unknown as Socket;

      (gameService.lockRoom as jest.Mock).mockReturnValueOnce(null);

      gateway.handleLockRoom(client, { accessCode: 'invalid' });

      expect(gameService.lockRoom).toHaveBeenCalledWith('invalid');
      expect(client.emit).toHaveBeenCalledWith('lockError', {
        message: 'Unable to lock room.',
      });
    });
  });

  describe('handleUnlockRoom', () => {
    it('should unlock the room and emit "roomUnlocked"', () => {
      const client = {
        emit: jest.fn(),
      } as unknown as Socket;

      (gameService.unlockRoom as jest.Mock).mockReturnValueOnce({ accessCode: '12345', locked: false } as GameRoom);

      gateway.handleUnlockRoom(client, { accessCode: '12345' });

      expect(gameService.unlockRoom).toHaveBeenCalledWith('12345');
      expect(mockServer.to).toHaveBeenCalledWith('12345');
      expect(mockServer.emit).toHaveBeenCalledWith('roomUnlocked', {
        room: { accessCode: '12345', locked: false },
      });
    });

    it('should emit "unlockError" if room is not found', () => {
      const client = {
        emit: jest.fn(),
      } as unknown as Socket;

      (gameService.unlockRoom as jest.Mock).mockReturnValueOnce(null);

      gateway.handleUnlockRoom(client, { accessCode: 'invalid' });

      expect(gameService.unlockRoom).toHaveBeenCalledWith('invalid');
      expect(client.emit).toHaveBeenCalledWith('unlockError', {
        message: 'Unable to unlock room.',
      });
    });
  });

  describe('handleStartGame', () => {
    it('should start the game and emit "gameStarted"', () => {
      const client = {
        emit: jest.fn(),
      } as unknown as Socket;

      (gameService.startGame as jest.Mock).mockReturnValueOnce({ accessCode: '12345', started: true } as GameRoom);

      gateway.handleStartGame(client, { accessCode: '12345' });

      expect(gameService.startGame).toHaveBeenCalledWith('12345');
      expect(mockServer.to).toHaveBeenCalledWith('12345');
      expect(mockServer.emit).toHaveBeenCalledWith('gameStarted', {
        room: { accessCode: '12345', started: true },
      });
    });

    it('should emit "startError" if game cannot be started', () => {
      const client = {
        emit: jest.fn(),
      } as unknown as Socket;

      (gameService.startGame as jest.Mock).mockReturnValueOnce(null);

      gateway.handleStartGame(client, { accessCode: 'invalid' });

      expect(gameService.startGame).toHaveBeenCalledWith('invalid');
      expect(client.emit).toHaveBeenCalledWith('startError', {
        message: 'Unable to start game. Make sure the room is locked and valid.',
      });
    });
  });

  describe('handleSubmitMove', () => {
    it('should submit the move and emit "moveSubmitted"', () => {
      const client = {
        emit: jest.fn(),
      } as unknown as Socket;
      const payload = { accessCode: '12345', playerId: 'player1', move: 'X' };

      (gameService.submitMove as jest.Mock).mockReturnValueOnce({ accessCode: '12345', move: 'X' } as GameRoom);

      gateway.handleSubmitMove(client, payload);

      expect(gameService.submitMove).toHaveBeenCalledWith('12345', 'player1', 'X');
      expect(mockServer.to).toHaveBeenCalledWith('12345');
      expect(mockServer.emit).toHaveBeenCalledWith('moveSubmitted', {
        room: { accessCode: '12345', move: 'X' },
        playerId: 'player1',
      });
    });

    it('should emit "moveError" if move submission fails', () => {
      const client = {
        emit: jest.fn(),
      } as unknown as Socket;
      const payload = { accessCode: 'invalid', playerId: 'player1', move: 'X' };

      (gameService.submitMove as jest.Mock).mockReturnValueOnce(null);

      gateway.handleSubmitMove(client, payload);

      expect(gameService.submitMove).toHaveBeenCalledWith('invalid', 'player1', 'X');
      expect(client.emit).toHaveBeenCalledWith('moveError', {
        message: 'Unable to submit move.',
      });
    });
  });

  describe('Lifecycle hooks', () => {
    it('afterInit should log initialization', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      const dummyServer = {} as Server;
      gateway.afterInit(dummyServer);
      expect(logSpy).toHaveBeenCalledWith('GameGateway Initialized' + dummyServer);
    });

    it('handleConnection should log connection and emit welcome message', () => {
      const client = {
        id: 'client1',
        emit: jest.fn(),
      } as unknown as Socket;
      const logSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.handleConnection(client);

      expect(logSpy).toHaveBeenCalledWith(`Client connected: ${client.id}`);
      expect(client.emit).toHaveBeenCalledWith('welcome', { message: 'Welcome to the game server!' });
    });

    it('handleDisconnect should log disconnection', () => {
      const client = {
        id: 'client1',
      } as unknown as Socket;
      const logSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.handleDisconnect(client);

      expect(logSpy).toHaveBeenCalledWith(`Client disconnected: ${client.id}`);
    });
  });
});
