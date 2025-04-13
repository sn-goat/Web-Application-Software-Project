/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-shadow */
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
import { IPlayer } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { Stats, mockStandardStats } from '@common/stats';
import { Entry, GameMessage } from '@common/journal';

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

        testPlayer = { id: 'p-test', avatar: Avatar.Cleric, position: { x: 1, y: 1 } } as IPlayer;
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
        const testPlayers = [{ id: 'p1', avatar: Avatar.Knight } as IPlayer];
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
            messageType: GameMessage.Quit,
            message: GameMessage.Quit + 'Jean',
            accessCode: 'ABC123',
            playersInvolved: ['otherPlayer456'],
        };
        socketServiceMock.triggerOnJournalEntry(mockEntry);
        expect(service.journalEntries.value).toEqual([mockEntry]);
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
                    player: Avatar.Wizard,
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
            avatar: Avatar.Knight,
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
        service.initFight(Avatar.Knight);

        // Assert
        expect(socketServiceMock.initFight).toHaveBeenCalledWith(testPlayer.id, defender.id);
    });

    it('should not init fight when no defender is found', () => {
        playerServiceMock.getPlayer.and.returnValue(testPlayer);
        service.playingPlayers.next([testPlayer]);
        spyOn(socketServiceMock, 'initFight');

        service.initFight(Avatar.Knight);

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

    it('should update map tile when broadcast door event occurs', () => {
        const initialMap: Cell[][] = [
            [{ tile: Tile.Floor, position: { x: 0, y: 0 } } as Cell, { tile: Tile.ClosedDoor, position: { x: 1, y: 0 } } as Cell],
            [{ tile: Tile.Floor, position: { x: 0, y: 1 } } as Cell, { tile: Tile.Floor, position: { x: 1, y: 1 } } as Cell],
        ];
        service.map.next(initialMap);

        const payload = {
            doorPosition: { x: 1, y: 0 },
            newDoorState: Tile.OpenedDoor,
        } as { doorPosition: Vec2; newDoorState: Tile.ClosedDoor | Tile.OpenedDoor };

        socketServiceMock.triggerDoorStateChanged(payload);
        expect(service.map.value[0][1].tile).toBe(Tile.OpenedDoor);
    });

    it('should toggle action mode when end fight event is received', () => {
        service.activePlayer.next({ id: 'p1', actions: 1 } as IPlayer);
        socketServiceMock.triggerEndFight([]);
        expect(service.isActionSelected.value).toBe(true);
    });

    it('should call onMove and update map/activePlayer when broadcast move event is received', () => {
        const initialMap: Cell[][] = [
            [
                { player: Avatar.Wizard, tile: Tile.Floor, position: { x: 0, y: 0 } } as Cell,
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
            avatar: Avatar.Cleric,
            position: { x: 1, y: 1 },
        } as IPlayer;
        playerServiceMock.getPlayer.and.returnValue(movingPlayer);

        initialMap[prevPos.y][prevPos.x].player = Avatar.Wizard;

        expect(service.map.value[prevPos.y][prevPos.x].player).toBe(Avatar.Wizard);
        expect(service.map.value[movingPlayer.position.y][movingPlayer.position.x].player).toBe('');
        expect(service.activePlayer.value).toEqual(movingPlayer);
    });

    it('should return player description when cell contains a player', () => {
        service.playingPlayers.next([testPlayer]);
        testPlayer.avatar = Avatar.Wizard;
        const cell: Cell = {
            player: testPlayer.avatar,
            tile: Tile.Floor,
            position: { x: 0, y: 0 },
        } as Cell;
        const expected = 'Joueur: ' + testPlayer.name + ' Avatar: Wizard';
        expect(service.getCellDescription(cell)).toEqual(expected);
    });

    it('should return tile description when cell has no player and no item', () => {
        const cell: Cell = {
            tile: Tile.Floor,
            position: { x: 0, y: 1 },
        } as Cell;
        const expected = service.getTileDescription(Tile.Floor);
        expect(service.getCellDescription(cell)).toEqual(expected);
    });

    it('should append item description when cell has an item', () => {
        spyOn(service, 'getTileDescription').and.returnValue('TileDesc');
        spyOn(service, 'getItemDescription').and.returnValue('ItemDesc');
        const cell: Cell = {
            tile: Tile.Floor,
            item: Item.Bow,
            position: { x: 1, y: 2 },
        } as Cell;
        const expected = 'TileDesc, ItemDesc';
        expect(service.getCellDescription(cell)).toEqual(expected);
    });

    it('should append item description when cell has a non-default item', () => {
        spyOn(service, 'getTileDescription').and.returnValue('TileDesc');
        spyOn(service, 'getItemDescription').and.returnValue('ItemDesc');
        const cell: Cell = {
            tile: Tile.Floor,
            item: Item.Bow,
            position: { x: 1, y: 2 },
        } as Cell;
        const expected = 'TileDesc, ItemDesc';
        expect(service.getCellDescription(cell)).toEqual(expected);
    });

    it('should append item description when cell contains a non-default item', () => {
        spyOn(service, 'getTileDescription').and.returnValue('TileDesc');
        spyOn(service, 'getItemDescription').and.returnValue('ItemDesc');
        const nonDefaultItem = Item.Bow;
        const cell: Cell = {
            tile: Tile.Floor,
            item: nonDefaultItem,
            position: { x: 1, y: 2 },
        } as Cell;
        const expected = 'TileDesc, ItemDesc';
        expect(service.getCellDescription(cell)).toEqual(expected);
    });

    it('should not append item description when cell item is default', () => {
        spyOn(service, 'getTileDescription').and.returnValue('TileDesc');
        spyOn(service, 'getItemDescription');
        const cell: Cell = {
            tile: Tile.Floor,
            item: Item.Default,
            position: { x: 1, y: 2 },
        } as Cell;
        const expected = 'TileDesc';
        expect(service.getCellDescription(cell)).toEqual(expected);
        expect(service.getItemDescription).not.toHaveBeenCalled();
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
                { player: Avatar.Cleric, tile: Tile.Floor, position: { x: 0, y: 0 } } as Cell,
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
