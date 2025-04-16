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
import { FightEvents, GameEvents, JournalEvent, StatsEvents, TurnEvents } from '@common/game.gateway.events';
import { Entry } from '@common/journal';
import { ChangeTurnPayload, DispatchStatsPayload, InventoryFullPayload, ItemCollectedPayload } from '@common/payload';
import { Team, VirtualPlayerStyles } from '@common/player';
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
        // --- Add these inside the "Event Handlers" describe block ---

        describe('handleCtfWinner', () => {
            it('should emit Winner event with correct player info', () => {
                const payload = { accessCode: 'room123', player: { id: 'player1', team: Team.Red } as Player };
                gateway.handleCtfWinner(payload);
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(GameEvents.Winner, payload.player);
            });
        });

        describe('handleEndTurn', () => {
            it('should emit PlayerTurn event with correct data', () => {
                const payload = {
                    accessCode: 'room123',
                    player: { name: 'Player1', id: 'player1' } as Player,
                    path: {} as any,
                } as ChangeTurnPayload;
                gateway.handleEndTurn(payload);
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(TurnEvents.PlayerTurn, {
                    player: payload.player,
                    path: payload.path,
                });
            });
        });

        describe('handleStats', () => {
            it('should emit StatsUpdate event with correct stats', () => {
                const payload = { accessCode: 'room456', stats: { score: 100 } } as any as DispatchStatsPayload;
                gateway.handleStats(payload);
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(StatsEvents.StatsUpdate, payload.stats);
            });
        });

        describe('changeFighter', () => {
            it('should emit ChangeFighter for human players only', () => {
                const human = { id: 'player1', name: 'Player1' };
                const fight = {
                    currentPlayer: { name: 'Player1' },
                    player1: human,
                    player2: human,
                } as unknown as Fight;
                gateway.changeFighter(fight);
                expect(server.to).toHaveBeenCalledWith(human.id);
                // Called twice (once for each player), but if both are same, you may check the call count.
                expect(emitMock).toHaveBeenCalledWith(FightEvents.ChangeFighter, fight);
            });
            it('should not emit for virtual players', () => {
                const human = { id: 'player1', name: 'Player1' };
                const virtual = new VirtualPlayer([], VirtualPlayerStyles.Aggressive);
                const fight = {
                    currentPlayer: human,
                    player1: virtual,
                    player2: human,
                } as unknown as Fight;
                gateway.changeFighter(fight);
                expect(server.to).not.toHaveBeenCalledWith(virtual.id);
                expect(server.to).toHaveBeenCalledWith(human.id);
                expect(emitMock).toHaveBeenCalledWith(FightEvents.ChangeFighter, fight);
            });
        });

        describe('handleStartTurn', () => {
            it('should emit Start event to the specified player id', () => {
                const playerId = 'player1';
                gateway.handleStartTurn(playerId);
                expect(server.to).toHaveBeenCalledWith(playerId);
                expect(emitMock).toHaveBeenCalledWith(TurnEvents.Start, {});
            });
        });

        describe('handleItemCollected', () => {
            it('should emit BroadcastItem with correct payload', () => {
                const payload = {
                    accessCode: 'room789',
                    player: { name: 'Player1' },
                    position: { x: 1, y: 1 },
                } as any as ItemCollectedPayload;
                gateway.handleItemCollected(payload);
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(TurnEvents.BroadcastItem, {
                    player: payload.player,
                    position: payload.position,
                });
            });
        });

        describe('handleInventoryFull', () => {
            it('should emit InventoryFull with correct data', () => {
                const payload = {
                    accessCode: 'room789',
                    player: { name: 'Player1' },
                    item: 'itemX',
                    position: { x: 0, y: 0 },
                } as any as InventoryFullPayload;
                gateway.handleInventoryFull(payload);
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(TurnEvents.InventoryFull, {
                    player: payload.player,
                    item: payload.item,
                    position: payload.position,
                });
            });
        });

        describe('handleDroppedItem', () => {
            it('should emit DroppedItem with correct data', () => {
                // Arrange
                const payload = {
                    accessCode: 'room789',
                    player: { id: 'player1', name: 'Player1' } as Player,
                    droppedItems: [
                        { item: Item.Sword, position: { x: 1, y: 2 } },
                        { item: Item.Pearl, position: { x: 3, y: 4 } },
                    ],
                };

                // Act
                gateway.handleDroppedItem(payload);

                // Assert
                expect(server.to).toHaveBeenCalledWith(payload.accessCode);
                expect(emitMock).toHaveBeenCalledWith(TurnEvents.DroppedItem, {
                    player: payload.player,
                    droppedItems: payload.droppedItems,
                });
            });
        });

        // --- Add these inside the "Socket Message Handlers" describe block (or extend the existing handleInventoryChoice tests) ---

        describe('handleInventoryChoice - extra branches', () => {
            it('should do nothing if game is not found', () => {
                gameManager.getGame.mockReturnValue(null);
                const payload = {
                    accessCode: 'room123',
                    playerId: 'player1',
                    itemToThrow: Item.Sword,
                    itemToAdd: Item.Pearl,
                    position: { x: 0, y: 0 },
                };
                gateway.handleInventoryChoice(client, payload);
                expect(gameManager.getGame).toHaveBeenCalledWith(payload.accessCode);
            });

            it('should do nothing if player is not found', () => {
                const mockGame = { getPlayerById: jest.fn().mockReturnValue(null) } as any;
                gameManager.getGame.mockReturnValue(mockGame);
                const payload = {
                    accessCode: 'room123',
                    playerId: 'nonexistent',
                    itemToThrow: Item.Sword,
                    itemToAdd: Item.Pearl,
                    position: { x: 0, y: 0 },
                };
                gateway.handleInventoryChoice(client, payload);
                expect(mockGame.getPlayerById).toHaveBeenCalledWith(payload.playerId);
            });
        });

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
        // Existing tests for handleGameStart, handlePlayerMovement, and handleInventoryChoice
        describe('handleGameStart', () => {
            it('should emit GameStarted with the configured game', () => {
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

            it('should emit an error if the game does not exist', () => {
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

        describe('handleReady', () => {
            it('should call startTurn if the player is admin', () => {
                // Arrange
                const room = {
                    isPlayerAdmin: jest.fn().mockReturnValue(true),
                    game: { startTurn: jest.fn() },
                } as unknown as any;
                gameManager.getRoom.mockReturnValue(room);

                const payload = {
                    accessCode: 'roomTest',
                    playerId: 'adminPlayer',
                };

                // Act
                gateway.handleReady(client, payload);

                // Assert
                expect(gameManager.getRoom).toHaveBeenCalledWith(payload.accessCode);
                expect(room.isPlayerAdmin).toHaveBeenCalledWith(payload.playerId);
                expect(room.game.startTurn).toHaveBeenCalled();
            });

            it('should not call startTurn if the player is not admin', () => {
                // Arrange
                const room = {
                    isPlayerAdmin: jest.fn().mockReturnValue(false),
                    game: { startTurn: jest.fn() },
                } as unknown as any;
                gameManager.getRoom.mockReturnValue(room);

                const payload = {
                    accessCode: 'roomTest',
                    playerId: 'nonAdmin',
                };

                // Act
                gateway.handleReady(client, payload);

                // Assert
                expect(room.isPlayerAdmin).toHaveBeenCalledWith(payload.playerId);
                expect(room.game.startTurn).not.toHaveBeenCalled();
            });
        });

        describe('handleDebug', () => {
            it('should emit DebugStateChanged when game exists', () => {
                // Arrange
                const accessCode = 'roomDebug';
                const organizerId = 'org123';
                const newDebugState = true;
                const mockGame = {
                    toggleDebug: jest.fn().mockReturnValue(newDebugState),
                } as unknown as Game;
                const room = { organizerId };

                gameManager.getGame.mockReturnValue(mockGame);
                gameManager.getRoom.mockReturnValue(room as any);

                // Act
                gateway.handleDebug(client, accessCode);

                // Assert
                expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
                expect(gameManager.getRoom).toHaveBeenCalledWith(accessCode);
                expect(mockGame.toggleDebug).toHaveBeenCalledWith(organizerId);
                expect(server.to).toHaveBeenCalledWith(accessCode);
                expect(emitMock).toHaveBeenCalledWith(GameEvents.DebugStateChanged, newDebugState);
            });

            it('should do nothing if game does not exist', () => {
                // Arrange
                const accessCode = 'roomDebug';
                gameManager.getGame.mockReturnValue(null);

                // Act
                gateway.handleDebug(client, accessCode);

                // Assert
                expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
                // No further action (no emit)
                expect(server.to).not.toHaveBeenCalledWith(accessCode);
            });
        });

        describe('debugPlayerMovement', () => {
            it('should call movePlayerDebug with the correct arguments', () => {
                // Arrange
                const payload = { accessCode: 'roomDM', playerId: 'player1', direction: { x: 3, y: 4 } as Vec2 };
                const mockGame = {
                    movePlayerDebug: jest.fn(),
                } as unknown as Game;
                gameManager.getGame.mockReturnValue(mockGame);

                // Act
                gateway.debugPlayerMovement(client, payload);

                // Assert
                expect(gameManager.getGame).toHaveBeenCalledWith(payload.accessCode);
                expect(mockGame.movePlayerDebug).toHaveBeenCalledWith(payload.direction, payload.playerId);
            });
        });

        describe('handleChangeDoorState', () => {
            it('should call changeDoorState with the correct arguments', () => {
                // Arrange
                const payload = {
                    accessCode: 'roomCDS',
                    doorPosition: { x: 5, y: 6 },
                    playerId: 'player2',
                };
                const mockGame = {
                    changeDoorState: jest.fn(),
                } as unknown as Game;
                gameManager.getGame.mockReturnValue(mockGame);

                // Act
                gateway.handleChangeDoorState(client, payload);

                // Assert
                expect(gameManager.getGame).toHaveBeenCalledWith(payload.accessCode);
                expect(mockGame.changeDoorState).toHaveBeenCalledWith(payload.doorPosition, payload.playerId);
            });
        });

        describe('handlePlayerEnd', () => {
            it('should call endTurn on the game', () => {
                // Arrange
                const accessCode = 'roomEnd';
                const mockGame = {
                    endTurn: jest.fn(),
                } as unknown as Game;
                gameManager.getGame.mockReturnValue(mockGame);

                // Act
                gateway.handlePlayerEnd(client, accessCode);

                // Assert
                expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
                expect(mockGame.endTurn).toHaveBeenCalled();
            });
        });

        describe('handleFightInit', () => {
            it('should call initFight with the correct player IDs', () => {
                // Arrange
                const payload = {
                    accessCode: 'roomFight',
                    playerInitiatorId: 'initiator',
                    playerDefenderId: 'defender',
                };
                const mockGame = {
                    initFight: jest.fn(),
                } as unknown as Game;
                gameManager.getGame.mockReturnValue(mockGame);

                // Act
                gateway.handleFightInit(client, payload);

                // Assert
                expect(gameManager.getGame).toHaveBeenCalledWith(payload.accessCode);
                expect(mockGame.initFight).toHaveBeenCalledWith(payload.playerInitiatorId, payload.playerDefenderId);
            });
        });

        describe('handlePlayerFlee', () => {
            it('should call flee on the game', () => {
                // Arrange
                const accessCode = 'roomFlee';
                const mockGame = {
                    flee: jest.fn(),
                } as unknown as Game;
                gameManager.getGame.mockReturnValue(mockGame);

                // Act
                gateway.handlePlayerFlee(client, accessCode);

                // Assert
                expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
                expect(mockGame.flee).toHaveBeenCalled();
            });
        });

        describe('handlePlayerAttack', () => {
            it('should call playerAttack on the game', () => {
                // Arrange
                const accessCode = 'roomAttack';
                const mockGame = {
                    playerAttack: jest.fn(),
                } as unknown as Game;
                gameManager.getGame.mockReturnValue(mockGame);

                // Act
                gateway.handlePlayerAttack(client, accessCode);

                // Assert
                expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
                expect(mockGame.playerAttack).toHaveBeenCalled();
            });
        });
    });
});
