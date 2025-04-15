/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Fight } from '@app/class/fight';
import { Game } from '@app/class/game';
import { Player } from '@app/class/player';
import { VirtualPlayer } from '@app/class/virtual-player';
import { FightResult, FightResultType } from '@app/constants/fight-interface';
import { GameGateway } from '@app/gateways/game/game.gateway';
import { GameManagerService } from '@app/services/game/games-manager.service';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { DoorState, PathInfo } from '@common/game';
import { FightEvents, GameEvents, JournalEvent, TurnEvents } from '@common/game.gateway.events';
import { Entry, GameMessage } from '@common/journal';
import { VirtualPlayerStyles } from '@common/player';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BroadcastOperator, Server, Socket } from 'socket.io';

describe('GameGateway', () => {
    let gateway: GameGateway;
    let server: jest.Mocked<Server>;
    let gameManager: jest.Mocked<GameManagerService>;
    let emitMock: jest.Mock;
    let broadcastOperator: Partial<BroadcastOperator<any, any>>;
    let client: jest.Mocked<Socket>;

    beforeEach(async () => {
        emitMock = jest.fn();

        broadcastOperator = {
            emit: emitMock,
            to: jest.fn().mockReturnThis(),
            except: jest.fn().mockReturnThis(),
            timeout: jest.fn().mockReturnThis(),
        };

        server = {
            to: jest.fn().mockReturnValue(broadcastOperator),
        } as unknown as jest.Mocked<Server>;

        client = {
            emit: jest.fn(),
            join: jest.fn(),
            leave: jest.fn(),
            id: 'client-id',
        } as unknown as jest.Mocked<Socket>;

        gameManager = {
            getGame: jest.fn(),
            getFight: jest.fn(),
            closeRoom: jest.fn(),
            getRoom: jest.fn(),
        } as unknown as jest.Mocked<GameManagerService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [GameGateway, { provide: GameManagerService, useValue: gameManager }, { provide: Logger, useValue: new Logger() }],
        }).compile();

        gateway = module.get<GameGateway>(GameGateway);
        gateway['server'] = server as any;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('Event Handlers', () => {
        // Test pour handleFightTimerUpdate
        describe('handleFightTimerUpdate', () => {
            it('devrait émettre un événement UpdateTimer aux deux joueurs du combat', () => {
                // Arrange
                const payload = { accessCode: 'game123', remainingTime: 15 };
                const fight = {
                    player1: { id: 'player1' },
                    player2: { id: 'player2' },
                } as Fight;
                gameManager.getFight.mockReturnValue(fight);

                // Act
                gateway.handleFightTimerUpdate(payload);

                // Assert
                expect(gameManager.getFight).toHaveBeenCalledWith(payload.accessCode);
                expect(server.to).toHaveBeenCalledWith(['player1', 'player2']);
                expect(emitMock).toHaveBeenCalledWith(FightEvents.UpdateTimer, payload.remainingTime);
            });
        });

        // Test pour handleTurnTimerUpdate
        describe('handleTurnTimerUpdate', () => {
            it('devrait émettre un événement UpdateTimer à toute la salle', () => {
                // Arrange
                const payload = { accessCode: 'room123', remainingTime: 30 };

                // Act
                gateway.handleTurnTimerUpdate(payload);

                // Assert
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(TurnEvents.UpdateTimer, payload.remainingTime);
            });
        });

        // Test pour handleDebugStateChange
        describe('handleDebugStateChange', () => {
            it('devrait émettre un événement DebugStateChanged à toute la salle', () => {
                // Arrange
                const payload = { accessCode: 'room456', newState: true };

                // Act
                gateway.handleDebugStateChange(payload);

                // Assert
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(GameEvents.DebugStateChanged, payload.newState);
            });
        });

        // Test pour handleMapUpdate
        describe('handleMapUpdate', () => {
            it('devrait émettre un événement MapUpdated à toute la salle', () => {
                // Arrange
                const mockMap = [[{ position: { x: 0, y: 0 }, tile: Tile.Floor }], [{ position: { x: 0, y: 1 }, tile: Tile.Wall }]] as Cell[][];
                const payload = { accessCode: 'room789', map: mockMap };

                // Act
                gateway.handleMapUpdate(payload);

                // Assert
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(GameEvents.MapUpdated, payload.map);
            });
        });

        // Test pour handleBroadcastMove
        describe('handleBroadcastMove', () => {
            it('devrait émettre un événement PlayerMoved à toute la salle', () => {
                // Arrange
                const player = { id: 'player1', name: 'Joueur1' } as Player;
                const previousPosition = { x: 3, y: 4 } as Vec2;
                const payload = { accessCode: 'room123', previousPosition, player };

                // Act
                gateway.handleBroadcastMove(payload);

                // Assert
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(TurnEvents.PlayerMoved, {
                    previousPosition,
                    player,
                });
            });
        });

        // Test pour sendDoorState
        describe('sendDoorState', () => {
            it('devrait émettre un événement DoorStateChanged à toute la salle', () => {
                // Arrange
                const doorState = {
                    position: { x: 2, y: 3 },
                    state: 'open',
                } as unknown as DoorState;
                const payload = { accessCode: 'room456', doorState };

                // Act
                gateway.sendDoorState(payload);

                // Assert
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(TurnEvents.DoorStateChanged, doorState);
            });
        });

        // Test pour handleUpdateTurn
        describe('handleUpdateTurn', () => {
            it('devrait émettre un événement UpdateTurn au joueur concerné', () => {
                // Arrange
                const player = { id: 'player1', name: 'Joueur1' } as Player;
                const path = {} as Record<string, PathInfo>;
                const turn = { player, path };

                // Act
                gateway.handleUpdateTurn(turn);

                // Assert
                expect(server.to).toHaveBeenCalledWith(player.id);
                expect(emitMock).toHaveBeenCalledWith(TurnEvents.UpdateTurn, turn);
            });
        });

        // Test pour handleFightInitialized
        describe('handleFightInitialized', () => {
            it('devrait émettre un événement Init aux joueurs humains uniquement', () => {
                // Arrange
                const player1 = { id: 'player1' } as Player;
                const player2 = { id: 'player2' } as Player;
                const fight = {
                    player1,
                    player2,
                    currentPlayer: player1,
                } as Fight;

                // Act
                gateway.handleFightInitialized(fight);

                // Assert
                expect(server.to).toHaveBeenCalledWith(player1.id);
                expect(server.to).toHaveBeenCalledWith(player2.id);
                expect(emitMock).toHaveBeenCalledTimes(2);
                expect(emitMock).toHaveBeenCalledWith(FightEvents.Init, fight);
            });

            it("ne devrait pas émettre d'événement aux joueurs virtuels", () => {
                // Arrange
                const player1 = { id: 'player1' } as Player;
                const player2 = new VirtualPlayer([], VirtualPlayerStyles.Aggressive);
                const fight = {
                    player1,
                    player2,
                    currentPlayer: player1,
                } as unknown as Fight;

                // Act
                gateway.handleFightInitialized(fight);

                // Assert
                expect(server.to).toHaveBeenCalledWith(player1.id);
                expect(server.to).toHaveBeenCalledTimes(1);
                expect(emitMock).toHaveBeenCalledTimes(1);
            });
        });

        // Test pour handleJournalEntry
        describe('handleJournalEntry', () => {
            it('devrait émettre un événement Add à toute la salle pour une entrée non-combat', () => {
                // Arrange
                const entry = {
                    message: 'Test message',
                    isFight: false,
                    playersInvolved: [],
                } as Entry;
                const payload = { accessCode: 'room123', entry };

                // Act
                gateway.handleJournalEntry(payload);

                // Assert
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(JournalEvent.Add, entry);
            });

            it('devrait émettre un événement Add aux joueurs impliqués pour une entrée de combat', () => {
                // Arrange
                const entry = {
                    message: 'Combat message',
                    isFight: true,
                    playersInvolved: ['player1', 'player2'],
                } as Entry;
                const payload = { accessCode: 'room123', entry };

                // Act
                gateway.handleJournalEntry(payload);

                // Assert
                expect(server.to).toHaveBeenCalledWith('player1');
                expect(server.to).toHaveBeenCalledWith('player2');
                expect(emitMock).toHaveBeenCalledTimes(2);
                expect(emitMock).toHaveBeenCalledWith(JournalEvent.Add, entry);
            });
        });

        // Test pour manageEndFight
        describe('manageEndFight', () => {
            it("devrait émettre un événement End avec null en cas d'égalité", () => {
                // Arrange
                const mockGame = {
                    timer: { resumeTimer: jest.fn() },
                } as unknown as Game;
                gameManager.getGame.mockReturnValue(mockGame);

                const payload = {
                    accessCode: 'room123',
                    fightResult: {
                        type: FightResultType.Tie,
                    },
                };

                // Act
                gateway.manageEndFight(payload);

                // Assert
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(FightEvents.End, null);
                expect(mockGame.timer.resumeTimer).toHaveBeenCalled();
            });

            it('devrait émettre les événements appropriés quand un joueur gagne', () => {
                // Arrange
                const winner = { id: 'winner', wins: 3 } as Player;
                const loser = { id: 'loser' } as Player;

                const mockGame = {
                    players: [winner, loser],
                    isCTF: false,
                    dispatchGameStats: jest.fn(),
                    dispatchJournalEntry: jest.fn(),
                } as unknown as Game;

                gameManager.getGame.mockReturnValue(mockGame);

                const payload = {
                    accessCode: 'room123',
                    fightResult: {
                        type: FightResultType.Decisive,
                        winner,
                        loser,
                    } as FightResult,
                };

                // Act
                gateway.manageEndFight(payload);

                // Assert
                expect(server.to).toHaveBeenCalledWith(winner.id);
                expect(emitMock).toHaveBeenCalledWith(FightEvents.Winner, winner);

                expect(server.to).toHaveBeenCalledWith(loser.id);
                expect(emitMock).toHaveBeenCalledWith(FightEvents.Loser, loser);

                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(FightEvents.End, mockGame.players);
            });

            it("ne devrait pas envoyer d'événements aux joueurs virtuels", () => {
                // Arrange
                const winner = new VirtualPlayer([], VirtualPlayerStyles.Aggressive);
                const loser = { id: 'loser' } as Player;

                const mockGame = {
                    players: [winner, loser],
                    isCTF: false,
                    dispatchGameStats: jest.fn(),
                    dispatchJournalEntry: jest.fn(),
                } as unknown as Game;

                gameManager.getGame.mockReturnValue(mockGame);

                const payload = {
                    accessCode: 'room123',
                    fightResult: {
                        type: FightResultType.Decisive,
                        winner,
                        loser,
                    } as FightResult,
                };

                // Act
                gateway.manageEndFight(payload);

                // Assert
                // Pas d'émission vers le joueur virtuel
                expect(server.to).not.toHaveBeenCalledWith(winner.id);

                // Émission vers le joueur humain
                expect(server.to).toHaveBeenCalledWith(loser.id);
                expect(emitMock).toHaveBeenCalledWith(FightEvents.Loser, loser);
            });
        });
    });

    describe('Socket Message Handlers', () => {
        describe('handleGameStart', () => {
            it('devrait émettre GameStarted avec le jeu configuré', () => {
                // Arrange
                const accessCode = 'room123';
                const mockGame = {
                    configureGame: jest.fn().mockReturnThis(),
                } as unknown as Game;
                gameManager.getGame.mockReturnValue(mockGame);

                // Act
                gateway.handleGameStart(client, accessCode);

                // Assert
                expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
                expect(mockGame.configureGame).toHaveBeenCalled();
                expect(server.to).toHaveBeenCalledWith(accessCode);
                expect(emitMock).toHaveBeenCalledWith(GameEvents.GameStarted, mockGame);
            });

            it("devrait émettre une erreur si le jeu n'existe pas", () => {
                // Arrange
                const accessCode = 'invalid';
                gameManager.getGame.mockReturnValue(null);

                // Act
                gateway.handleGameStart(client, accessCode);

                // Assert
                expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
                expect(server.to).not.toHaveBeenCalled();
            });
        });

        describe('handlePlayerMovement', () => {
            it('devrait appeler processPath sur le jeu', () => {
                // Arrange
                const payload = {
                    accessCode: 'room123',
                    playerId: 'player1',
                    path: { path: [], cost: 0 } as PathInfo,
                };

                const mockGame = {
                    processPath: jest.fn(),
                } as unknown as Game;

                gameManager.getGame.mockReturnValue(mockGame);

                // Act
                gateway.handlePlayerMovement(client, payload);

                // Assert
                expect(gameManager.getGame).toHaveBeenCalledWith(payload.accessCode);
                expect(mockGame.processPath).toHaveBeenCalledWith(payload.path, payload.playerId);
            });
        });

        describe('handleInventoryChoice', () => {
            it("devrait mettre à jour l'inventaire et la carte", () => {
                // Arrange
                const player = {
                    id: 'player1',
                    removeItemFromInventory: jest.fn(),
                    addItemToInventory: jest.fn(),
                } as unknown as Player;

                const mockGame = {
                    getPlayerById: jest.fn().mockReturnValue(player),
                    map: [[{ item: Item.Default }]],
                    pendingEndTurn: false,
                } as unknown as Game;

                gameManager.getGame.mockReturnValue(mockGame);

                const payload = {
                    accessCode: 'room123',
                    playerId: 'player1',
                    itemToThrow: Item.Pearl,
                    itemToAdd: Item.Sword,
                    position: { x: 0, y: 0 },
                };

                // Act
                gateway.handleInventoryChoice(client, payload);

                // Assert
                expect(gameManager.getGame).toHaveBeenCalledWith(payload.accessCode);
                expect(mockGame.getPlayerById).toHaveBeenCalledWith(payload.playerId);
                expect(player.removeItemFromInventory).toHaveBeenCalledWith(payload.itemToThrow);
                expect(player.addItemToInventory).toHaveBeenCalledWith(payload.itemToAdd);
                expect(mockGame.map[0][0].item).toBe(payload.itemToThrow);
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(TurnEvents.MapUpdate, {
                    player,
                    item: payload.itemToThrow,
                    position: payload.position,
                });
            });

            it('devrait terminer le tour si pendingEndTurn est vrai', () => {
                // Arrange
                const player = {
                    id: 'player1',
                    removeItemFromInventory: jest.fn(),
                    addItemToInventory: jest.fn(),
                } as unknown as Player;

                const mockGame = {
                    getPlayerById: jest.fn().mockReturnValue(player),
                    map: [[{ item: Item.Default }]],
                    pendingEndTurn: true,
                    endTurn: jest.fn(),
                } as unknown as Game;

                gameManager.getGame.mockReturnValue(mockGame);

                const payload = {
                    accessCode: 'room123',
                    playerId: 'player1',
                    itemToThrow: Item.Pearl,
                    itemToAdd: Item.Sword,
                    position: { x: 0, y: 0 },
                };

                // Act
                gateway.handleInventoryChoice(client, payload);

                // Assert
                expect(mockGame.endTurn).toHaveBeenCalled();
            });
        });
    });
});
