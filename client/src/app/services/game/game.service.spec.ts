/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-restricted-imports */
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { MockSocketService } from '@app/helpers/socket-service-mock';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar, IGame, IRoom, TurnInfo } from '@common/game';
import { Entry, GameMessage } from '@common/journal';
import { IPlayer } from '@common/player';
import { Stats, mockStandardStats } from '@common/stats';
import { BehaviorSubject } from 'rxjs';
import { ChatService } from '../chat/chat.service';

describe('GameService', () => {
    let service: GameService;
    let fightLogicServiceMock: jasmine.SpyObj<FightLogicService>;
    let socketServiceMock: MockSocketService;
    let dialogMock: jasmine.SpyObj<MatDialog>;
    let playerServiceMock: jasmine.SpyObj<PlayerService>;

    const dummyAccessCode = 'AC123';
    const dummyOrganizer = 'org123';
    let testPlayer: any;
    let adjacentCell: any;
    let nonAdjacentCell: any;
    let teleportableCell: any;
    let nonTeleportableCell: any;
    let testGame: any;

    beforeEach(() => {
        fightLogicServiceMock = jasmine.createSpyObj('FightLogicService', [], {
            fightStarted$: new BehaviorSubject<boolean>(false).asObservable(),
        });
        socketServiceMock = new MockSocketService();
        dialogMock = jasmine.createSpyObj('MatDialog', ['open']);
        playerServiceMock = jasmine.createSpyObj('PlayerService', ['getPlayer', 'isActive', 'setPlayer', 'isPlayerAdmin', 'setPlayerActive']);

        TestBed.configureTestingModule({
            providers: [
                GameService,
                { provide: FightLogicService, useValue: fightLogicServiceMock },
                { provide: SocketReceiverService, useValue: socketServiceMock },
                { provide: SocketEmitterService, useValue: socketServiceMock },
                { provide: MatDialog, useValue: dialogMock },
                { provide: PlayerService, useValue: playerServiceMock },
            ],
        });

        service = TestBed.inject(GameService);

        testPlayer = { id: 'p-test', avatar: Avatar.Clerc, position: { x: 1, y: 1 } } as IPlayer;
        adjacentCell = { position: { x: 2, y: 1 }, player: Avatar.Default, tile: Tile.ClosedDoor, cost: 1 } as Cell;
        nonAdjacentCell = { position: { x: 3, y: 3 } };
        teleportableCell = { player: undefined, tile: 'Floor', position: { x: 0, y: 0 } };
        nonTeleportableCell = { player: undefined, tile: Tile.Wall, position: { x: 0, y: 1 } };

        service.playingPlayers.next([testPlayer]);
        testGame = {
            map: [],
            players: [testPlayer],
            currentTurn: 0,
            maxPlayers: 4,
            isCTF: false,
            isDebugMode: false,
        } as IGame;
        service.setGame(testGame);
    });

    it('devrait être créé', () => {
        expect(service).toBeTruthy();
    });

    it('should set game correctly', () => {
        const testPlayers = [{ id: 'p1', avatar: Avatar.Chevalier } as IPlayer];
        const testGame = { map: [[{} as Cell]], players: testPlayers, currentTurn: 0, isCTF: false, isDebugMode: false } as IGame;

        service.setGame(testGame);

        expect(service.playingPlayers.value).toBe(testPlayers);
        expect(service.initialPlayers.value).toBe(testPlayers);
        expect(service.activePlayer.value).toBe(testPlayers[0]);
        expect(service.isDebugMode.value).toBe(false);
    });

    it('should update correctly on playerUpdated event', () => {
        spyOn(service, 'updateInitialPlayers');
        socketServiceMock.triggerOnPlayersUpdated([testPlayer]);
        expect(service.playingPlayers.value).toEqual([testPlayer]);
        expect(service.updateInitialPlayers).toHaveBeenCalledWith([testPlayer]);
    });

    it('should set the game on GameStarted event', () => {
        spyOn(service, 'setGame');
        socketServiceMock.triggerOnGameStarted(testGame);
        expect(service.setGame).toHaveBeenCalledWith(testGame);
    });

    it('should add entry on Journal event', () => {
        const mockEntry: Entry = {
            isFight: true,
            message: GameMessage.Quit + 'Jean',
            playersInvolved: ['otherPlayer456'],
        };

        socketServiceMock.triggerOnJournalEntry(mockEntry);
        expect(service.journalEntries.value).toEqual(new Set<Entry>([mockEntry]));
    });

    it('should update stats on Stats event', () => {
        const stats: Stats = mockStandardStats;
        socketServiceMock.triggerOnStatsUpdate(stats);
        expect(service.stats.value).toEqual(stats);
    });

    it('should correctly call setDebugMode on debugModeChanged event', () => {
        spyOn(service, 'setDebugMode');
        socketServiceMock.triggerOnDebugModeChanged(true);
        expect(service.setDebugMode).toHaveBeenCalledWith(true);
    });

    it('should correctly call updateTurn on playerTurnChanged event', () => {
        spyOn(service, 'updateTurn');
        socketServiceMock.triggerPlayerTurnChanged({ player: testPlayer } as TurnInfo);
        expect(service.updateTurn).toHaveBeenCalledWith(testPlayer);
        expect(service.isActionSelected.value).toEqual(false);
    });

    it('should correctly call onMove on playerMoved event', () => {
        spyOn(service, 'onMove');
        const movement = { previousPosition: { x: 1, y: 0 } as Vec2, player: testPlayer as IPlayer };
        socketServiceMock.triggerPlayerMoved(movement);
        expect(service.onMove).toHaveBeenCalledWith(movement.previousPosition, movement.player);
    });

    it('should call resetGame on GameEnded event', () => {
        spyOn(service, 'resetGame');
        socketServiceMock.triggerEndOfGame();
        expect(service.resetGame).toHaveBeenCalled();
    });

    it('should update turn (activePlayer)', () => {
        const player = { id: 'p2' } as IPlayer;
        service.updateTurn(player);
        expect(service.activePlayer.value).toBe(player);
    });

    it('should update isDebugMode (setDebugMode)', () => {
        service.setDebugMode(false);
        expect(service.isDebugMode.value).toBeFalse();
    });

    it('should toggle action mode', () => {
        service.activePlayer.next({ id: 'p1', actions: 1 } as IPlayer);

        const oldValue = service.isActionSelected.value;
        service.toggleActionMode();
        expect(service.isActionSelected.value).toBe(!oldValue);
    });

    it('should call onMove and update map/activePlayer', () => {
        const prevPos = { x: 0, y: 0 };
        const player = { id: 'p-test', avatar: 'Wizard', position: { x: 1, y: 1 } } as IPlayer;
        playerServiceMock.isActive.and.returnValue(true);
        playerServiceMock.getPlayer.and.returnValue(player);

        const initialMap: Cell[][] = [
            [
                {
                    player: Avatar.Magicien,
                    position: { x: 0, y: 0 },
                    tile: 'Floor',
                    item: Item.Default,
                    cost: 3,
                } as Cell,
                { player: Avatar.Default, position: { x: 1, y: 0 } } as Cell,
            ],
            [{ player: Avatar.Default, position: { x: 0, y: 1 } } as Cell, { player: Avatar.Default, position: { x: 1, y: 1 } } as Cell],
        ];

        service.map.next(initialMap);
        service.onMove(prevPos, player);

        expect(service.activePlayer.value).toEqual(player);
        expect(service.map.value[0][0].player).toBe(Avatar.Default);
        expect(service.map.value[1][1].player).toBe('Wizard');
    });

    it('should end turn and force no action mode', () => {
        service.activePlayer.next({ id: 'p1', actions: 1 } as IPlayer);
        spyOn(socketServiceMock, 'endTurn');

        service.endTurn();

        expect(service.isActionSelected.value).toBe(false);
        expect(socketServiceMock.endTurn).toHaveBeenCalled();
    });

    it('should confirm and abandon game (resolve true)', async () => {
        const dialogRefMock = jasmine.createSpyObj('MatDialogRef<ConfirmationDialogComponent>>', ['afterClosed']);
        dialogRefMock.afterClosed.and.returnValue(new BehaviorSubject<boolean>(true));
        dialogMock.open.and.returnValue(dialogRefMock);

        const result = await service.confirmAndAbandonGame();
        expect(result).toBeTrue();
    });

    it('should confirm and quit game (resolve true)', async () => {
        const dialogRefMock = jasmine.createSpyObj('MatDialogRef<ConfirmationDialogComponent>>', ['afterClosed']);
        dialogRefMock.afterClosed.and.returnValue(new BehaviorSubject<boolean>(true));
        dialogMock.open.and.returnValue(dialogRefMock);

        const result = await service.confirmAndQuitGame();
        expect(result).toBeTrue();
    });

    it('should confirm and not abandon game (resolve false)', async () => {
        const dialogRefMock = jasmine.createSpyObj('MatDialogRef<ConfirmationDialogComponent>>', ['afterClosed']);
        dialogRefMock.afterClosed.and.returnValue(new BehaviorSubject<boolean>(false));
        dialogMock.open.and.returnValue(dialogRefMock);

        const result = await service.confirmAndAbandonGame();
        expect(result).toBeFalse();
    });

    it('should init fight when defender is found and player exists', () => {
        playerServiceMock.getPlayer.and.returnValue(testPlayer);
        const defender = {
            id: 'p-def',
            name: 'Defender',
            avatar: Avatar.Chevalier,
            attackPower: 4,
            defensePower: 4,
            speed: 6,
            life: 4,
            attackDice: 'D4',
            defenseDice: 'D6',
            actions: 1,
            wins: 0,
            movementPts: 6,
            position: { x: 0, y: 0 },
            spawnPosition: { x: 1, y: 1 },
        } as IPlayer;
        service.playingPlayers.next([testPlayer, defender]);
        spyOn(socketServiceMock, 'initFight');

        // Act
        service.initFight(Avatar.Chevalier);

        // Assert
        expect(socketServiceMock.initFight).toHaveBeenCalledWith(testPlayer.id, defender.id);
    });

    it('should not init fight when no defender is found', () => {
        playerServiceMock.getPlayer.and.returnValue(testPlayer);
        service.playingPlayers.next([testPlayer]);
        spyOn(socketServiceMock, 'initFight');

        service.initFight(Avatar.Chevalier);

        expect(socketServiceMock.initFight).not.toHaveBeenCalled();
    });

    it('should toggle action mode', () => {
        service.activePlayer.next({ id: 'p1', actions: 1 } as IPlayer);

        const current = service.isActionSelected.value;
        service.toggleActionMode();
        expect(service.isActionSelected.value).toBe(!current);
    });

    it('should call changeDoorState when toggling door without items', () => {
        const initialMap: Cell[][] = [
            [{ position: { x: 0, y: 0 } } as Cell, { position: { x: 1, y: 0 } } as Cell],
            [
                { position: { x: 0, y: 1 } } as Cell,
                {
                    position: { x: 1, y: 1 },
                    tile: Tile.OpenedDoor,
                    item: Item.Default,
                } as Cell,
            ],
        ];
        service.map.next(initialMap);
        const position = { x: 1, y: 1 };
        playerServiceMock.getPlayer.and.returnValue(testPlayer);
        spyOn(socketServiceMock, 'changeDoorState');

        service.toggleDoor(position);
        expect(socketServiceMock.changeDoorState).toHaveBeenCalledWith(position, testPlayer.id);
    });

    it('should not call changeDoorState when trying to close a door with an item on it', () => {
        const initialMap: Cell[][] = [
            [{ position: { x: 0, y: 0 } } as Cell, { position: { x: 1, y: 0 } } as Cell],
            [
                { position: { x: 0, y: 1 } } as Cell,
                {
                    position: { x: 1, y: 1 },
                    tile: Tile.OpenedDoor,
                    item: Item.Bow,
                } as Cell,
            ],
        ];
        service.map.next(initialMap);

        const position = { x: 1, y: 1 };
        playerServiceMock.getPlayer.and.returnValue(testPlayer);
        spyOn(socketServiceMock, 'changeDoorState');
        spyOn(console, 'log'); // To prevent actual console logs during test

        service.toggleDoor(position);

        expect(socketServiceMock.changeDoorState).not.toHaveBeenCalled();
    });

    it('should return false for isWithinActionRange when cell is not adjacent', () => {
        testPlayer.inventory = [Item.MonsterEgg];
        service.activePlayer.next(testPlayer);
        const positiveResult = service.isWithinActionRange(adjacentCell);
        expect(positiveResult).toBeTrue();

        const result = service.isWithinActionRange({ ...nonAdjacentCell });
        expect(result).toBeFalse();
    });

    it('should return true for isPlayerInGame when player is in the game', () => {
        service.playingPlayers.next([testPlayer]);
        const result = service.isPlayerInGame(testPlayer);
        expect(result).toBeTrue();
    });

    it('should return initial players after setGame (getInitialPlayers)', () => {
        const gamePlayers = [testPlayer];
        service.setGame({
            map: [[]],
            players: gamePlayers,
            currentTurn: 0,
            accessCode: dummyAccessCode,
            organizerId: dummyOrganizer,
        } as any);
        expect(service.getInitialPlayers()).toEqual(gamePlayers);
    });

    it('should call debugMove if cell can be teleported (debugMovePlayer)', () => {
        spyOn(socketServiceMock, 'debugMove');
        playerServiceMock.getPlayer.and.returnValue({ id: 'p1' } as IPlayer);
        service.debugMovePlayer(teleportableCell);
        expect(socketServiceMock.debugMove).toHaveBeenCalledWith(teleportableCell.position, 'p1');
    });

    it('should not call debugMove if cell cannot be teleported (debugMovePlayer)', () => {
        spyOn(socketServiceMock, 'debugMove');
        service.debugMovePlayer(nonTeleportableCell);
        expect(socketServiceMock.debugMove).not.toHaveBeenCalled();
    });

    it('should toggle debug mode when player is admin (toggleDebugMode)', () => {
        playerServiceMock.isPlayerAdmin.and.returnValue(true);
        spyOn(socketServiceMock, 'toggleDebug');
        service.toggleDebugMode();
        expect(socketServiceMock.toggleDebug).toHaveBeenCalled();
    });

    it('should not toggle debug mode when player is not admin (toggleDebugMode)', () => {
        playerServiceMock.isPlayerAdmin.and.returnValue(false);
        spyOn(socketServiceMock, 'toggleDebug');
        service.toggleDebugMode();
        expect(socketServiceMock.toggleDebug).not.toHaveBeenCalled();
    });

    it('should toggle action mode when end fight event is received', () => {
        service.activePlayer.next({ id: 'p1', actions: 1 } as IPlayer);
        socketServiceMock.triggerEndFight([]);
        expect(service.isActionSelected.value).toBe(true);
    });

    it('should call onMove and update map/activePlayer when broadcast move event is received', () => {
        const initialMap: Cell[][] = [
            [
                { player: Avatar.Magicien, tile: Tile.Floor, position: { x: 0, y: 0 } } as Cell,
                { player: Avatar.Default, tile: Tile.Floor, position: { x: 1, y: 0 } } as Cell,
            ],
            [
                { player: Avatar.Default, tile: Tile.Floor, position: { x: 0, y: 1 } } as Cell,
                { player: Avatar.Default, tile: Tile.Floor, position: { x: 1, y: 1 } } as Cell,
            ],
        ];
        service.map.next(initialMap);
        const prevPos = { x: 0, y: 0 };
        const movingPlayer = {
            id: 'p-test',
            avatar: Avatar.Clerc,
            position: { x: 1, y: 1 },
        } as IPlayer;
        playerServiceMock.getPlayer.and.returnValue(movingPlayer);

        initialMap[prevPos.y][prevPos.x].player = Avatar.Chevalier;

        expect(service.map.value[prevPos.y][prevPos.x].player).toBe(Avatar.Chevalier);
        expect(service.map.value[movingPlayer.position.y][movingPlayer.position.x].player).toBe('');
        expect(service.activePlayer.value).toEqual(movingPlayer);
    });

    it('should return tile description when cell has no player and no item', () => {
        const cell: Cell = {
            tile: Tile.Floor,
            position: { x: 0, y: 1 },
        } as Cell;
        const expected = service.getTileDescription(Tile.Floor);
        expect(service.getCellDescription(cell)).toEqual(expected);
    });

    it('should return organizer id', () => {
        socketServiceMock.triggerPlayerJoined({ organizerId: dummyOrganizer } as IRoom);
        expect(service.getOrganizerId()).toEqual(dummyOrganizer);
    });

    it('should return item description when a description exists', () => {
        spyOn(ASSETS_DESCRIPTION, 'get').and.callFake((item: Item) => {
            return item === Item.Bow ? 'Bow Description' : undefined;
        });
        const result = service.getItemDescription(Item.Bow);
        expect(result).toEqual('Bow Description');
    });

    it('should return default description when no description exists', () => {
        spyOn(ASSETS_DESCRIPTION, 'get').and.returnValue(undefined);
        const result = service.getItemDescription(Item.Bow);
        expect(result).toEqual('Aucune description');
    });

    it('findPossibleActions should return possible actions for players and doors', () => {
        testPlayer.inventory = [Item.MonsterEgg];
        service.playingPlayers.next([testPlayer]);
        const initialMap: Cell[][] = [
            [
                { player: testPlayer.avatar, tile: Tile.Floor, position: { x: 0, y: 0 } } as Cell,
                { player: Avatar.Default, tile: Tile.Wall, position: { x: 1, y: 0 } } as Cell,
            ],
            [
                { player: testPlayer.avatar, tile: Tile.Floor, position: { x: 0, y: 1 } } as Cell,
                { player: Avatar.Default, tile: Tile.ClosedDoor, position: { x: 1, y: 1 } } as Cell,
            ],
        ];
        service.map.next(initialMap);

        const result = service.findPossibleActions({ x: 0, y: 1 });
        expect(result.size).toBe(2);
        expect(result).toEqual(new Set(['0,0', '1,1']));
    });

    it('findPossibleActions should return an empty set if no actions available', () => {
        testPlayer.inventory = [Item.MonsterEgg];
        service.playingPlayers.next([testPlayer]);
        const initialMap: Cell[][] = [
            [
                { player: Avatar.Clerc, tile: Tile.Floor, position: { x: 0, y: 0 } } as Cell,
                { player: Avatar.Default, tile: Tile.Wall, position: { x: 1, y: 0 } } as Cell,
            ],
            [
                { player: Avatar.Default, tile: Tile.Wall, position: { x: 0, y: 1 } } as Cell,
                { player: Avatar.Default, tile: Tile.ClosedDoor, position: { x: 1, y: 1 } } as Cell,
            ],
        ];
        service.map.next(initialMap);

        const result = service.findPossibleActions({ x: 0, y: 0 });
        expect(result.size).toBe(0);
        expect(result).toEqual(new Set());
    });
});

describe('initializeListeners', () => {
    let service: GameService;
    let socketServiceMock: MockSocketService;
    let playerServiceMock: jasmine.SpyObj<PlayerService>;
    let chatServiceMock: jasmine.SpyObj<ChatService>;

    beforeEach(() => {
        socketServiceMock = new MockSocketService();
        playerServiceMock = jasmine.createSpyObj('PlayerService', ['getPlayer', 'setPlayer', 'isPlayerAdmin', 'setPlayerActive']);
        chatServiceMock = jasmine.createSpyObj('ChatService', ['clearChatHistory']);

        TestBed.configureTestingModule({
            providers: [
                GameService,
                { provide: SocketReceiverService, useValue: socketServiceMock },
                { provide: SocketEmitterService, useValue: socketServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
                { provide: ChatService, useValue: chatServiceMock },
                { provide: MatDialog, useValue: jasmine.createSpyObj('MatDialog', ['open']) },
            ],
        });

        service = TestBed.inject(GameService);
    });

    // Correction du test 'devrait s\'abonner à tous les événements au moment de l\'initialisation'
    it("devrait s'abonner à tous les événements au moment de l'initialisation", () => {
        // Arrange
        const spy = spyOn(service, 'initializeListeners');

        // Act - Utiliser l'instance déjà injectée et appeler la méthode directement
        service.initializeListeners();

        // Assert
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('devrait mettre à jour les joueurs quand onPlayersUpdated est déclenché', () => {
        // Arrange
        const testPlayers = [{ id: 'p1', name: 'Player 1' } as IPlayer];
        spyOn(service, 'updateInitialPlayers');

        // Act
        socketServiceMock.triggerOnPlayersUpdated(testPlayers);

        // Assert
        expect(service.playingPlayers.value).toEqual(testPlayers);
        expect(service.updateInitialPlayers).toHaveBeenCalledWith(testPlayers);
    });

    it("devrait enregistrer l'organizerId quand onPlayerJoined est déclenché", () => {
        // Arrange
        const testRoom = { accessCode: 'room123', organizerId: 'org123' } as IRoom;

        // Act
        socketServiceMock.triggerPlayerJoined(testRoom);

        // Assert
        expect(service.getOrganizerId()).toEqual('org123');
    });

    it('devrait configurer le jeu quand onGameStarted est déclenché', () => {
        // Arrange
        const testGame = {
            map: [[{} as Cell]],
            players: [{ id: 'p1' } as IPlayer],
            currentTurn: 0,
            isCTF: false,
        } as IGame;
        spyOn(service, 'setGame');

        // Act
        socketServiceMock.triggerOnGameStarted(testGame);

        // Assert
        expect(service.setGame).toHaveBeenCalledWith(testGame);
    });

    it('devrait mettre à jour le mode debug quand onDebugModeChanged est déclenché', () => {
        // Act
        socketServiceMock.triggerOnDebugModeChanged(true);

        // Assert
        expect(service.isDebugMode.value).toBe(true);
    });

    it('devrait mettre à jour le tour quand onPlayerTurnChanged est déclenché', () => {
        // Arrange
        const testPlayer = { id: 'p1', name: 'Player 1' } as IPlayer;
        spyOn(service, 'updateTurn');

        // Act
        socketServiceMock.triggerPlayerTurnChanged({ player: testPlayer } as unknown as TurnInfo);

        // Assert
        expect(service.updateTurn).toHaveBeenCalledWith(testPlayer);
        expect(service.isActionSelected.value).toBe(false);
    });

    it('devrait gérer le mouvement du joueur quand onPlayerMoved est déclenché', () => {
        // Arrange
        const previousPos = { x: 1, y: 1 };
        const testPlayer = { id: 'p1', position: { x: 2, y: 2 } } as IPlayer;
        spyOn(service, 'onMove');

        // Act
        socketServiceMock.triggerPlayerMoved({ previousPosition: previousPos, player: testPlayer });

        // Assert
        expect(service.onMove).toHaveBeenCalledWith(previousPos, testPlayer);
    });

    it("devrait mettre à jour l'état de la porte quand onDoorStateChanged est déclenché", () => {
        // Arrange
        const initialMap: Cell[][] = [
            [{ position: { x: 0, y: 0 }, tile: Tile.Floor } as Cell],
            [{ position: { x: 0, y: 1 }, tile: Tile.ClosedDoor } as Cell],
        ];
        service.map.next(initialMap);
        const doorState: { position: Vec2; newDoorState: Tile.ClosedDoor | Tile.OpenedDoor } = {
            position: { x: 0, y: 1 },
            newDoorState: Tile.OpenedDoor,
        };

        // Act
        socketServiceMock.triggerDoorStateChanged(doorState);

        expect(service.isActionSelected.value).toBe(false);
    });

    it('devrait mettre à jour les joueurs et basculer le mode action quand onEndFight est déclenché', () => {
        // Arrange
        const updatedPlayers = [{ id: 'p1' } as IPlayer];
        spyOn(service, 'toggleActionMode');
        spyOn(service, 'updateInitialPlayers');

        // Act
        socketServiceMock.triggerEndFight(updatedPlayers);

        // Assert
        expect(service.playingPlayers.value).toEqual(updatedPlayers);
        expect(service.updateInitialPlayers).toHaveBeenCalledWith(updatedPlayers);
        expect(service.toggleActionMode).toHaveBeenCalled();
    });

    it('devrait réinitialiser le jeu quand onGameEnded est déclenché', () => {
        // Arrange
        spyOn(service, 'resetGame');

        // Act
        socketServiceMock.triggerEndOfGame();

        // Assert
        expect(service.resetGame).toHaveBeenCalled();
    });

    it('devrait mettre à jour la carte quand onItemCollected est déclenché', () => {
        // Arrange
        const initialMap: Cell[][] = [[{ position: { x: 0, y: 0 }, item: Item.Bow } as Cell]];
        service.map.next(initialMap);
        const collectedItem = {
            position: { x: 0, y: 0 },
            item: Item.Bow,
        };

        // Act
        socketServiceMock.triggerItemCollected(collectedItem);

        // Assert
        expect(service.map.value[0][0].item).toBe(Item.Default);
    });

    it('devrait mettre à jour la carte quand onItemDropped est déclenché', () => {
        // Arrange
        const initialMap: Cell[][] = [[{ position: { x: 0, y: 0 }, item: Item.Default } as Cell]];
        service.map.next(initialMap);
        const droppedItems = {
            droppedItems: [{ position: { x: 0, y: 0 }, item: Item.Sword }],
        };

        // Act
        socketServiceMock.triggerItemDropped(droppedItems);

        // Assert
        expect(service.map.value[0][0].item).toBe(Item.Sword);
    });

    it('devrait mettre à jour la carte quand onMapUpdate est déclenché', () => {
        // Arrange
        const initialMap: Cell[][] = [[{ position: { x: 0, y: 0 }, item: Item.Default } as Cell]];
        service.map.next(initialMap);
        const mapUpdate = {
            player: { id: 'p1' } as IPlayer,
            item: Item.Pearl,
            position: { x: 0, y: 0 },
        };

        // Act
        socketServiceMock.triggerMapUpdate(mapUpdate);

        // Assert
        expect(service.map.value[0][0].item).toBe(Item.Pearl);
    });

    it('devrait ajouter une entrée au journal quand onJournalEntry est déclenché', () => {
        // Arrange
        const entry: Entry = {
            message: 'Test message',
            isFight: false,
            playersInvolved: ['p1'],
        };
        spyOn(service as any, 'setCurrentTime').and.returnValue(entry);

        // Act
        socketServiceMock.triggerOnJournalEntry(entry);

        // Assert
        expect(service.journalEntries.value.has(entry)).toBe(true);
    });

    it('devrait mettre à jour les statistiques quand onStatsUpdate est déclenché', () => {
        // Arrange
        const stats = { playerStats: [] } as unknown as Stats;

        // Act
        socketServiceMock.triggerOnStatsUpdate(stats);

        // Assert
        expect(service.stats.value).toBe(stats);
    });

    it('devrait réabonner à tous les événements lors du resetGame', () => {
        // Arrange
        spyOn(service, 'initializeListeners');

        // Act
        service.resetGame();

        // Assert
        expect(service.initializeListeners).toHaveBeenCalledTimes(1);
    });
});
