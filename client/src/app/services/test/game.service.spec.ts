/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-shadow */
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { MockSocketService } from '@app/helpers/mockSocketService';
import { FightLogicService } from '@app/services/code/fight-logic.service';
import { GameService } from '@app/services/code/game.service';
import { PlayerService } from '@app/services/code/player.service';
import { SocketService } from '@app/services/code/socket.service';
import { Cell } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar, Game } from '@common/game';
import { PlayerStats } from '@common/player';
import { BehaviorSubject } from 'rxjs';

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

    beforeEach(() => {
        fightLogicServiceMock = jasmine.createSpyObj('FightLogicService', [], {
            fightStarted$: new BehaviorSubject<boolean>(false).asObservable(),
        });
        socketServiceMock = new MockSocketService();
        dialogMock = jasmine.createSpyObj('MatDialog', ['open']);
        playerServiceMock = jasmine.createSpyObj('PlayerService', ['getPlayer', 'isActive', 'setPlayer', 'isPlayerAdmin']);

        TestBed.configureTestingModule({
            providers: [
                GameService,
                { provide: FightLogicService, useValue: fightLogicServiceMock },
                { provide: SocketService, useValue: socketServiceMock },
                { provide: MatDialog, useValue: dialogMock },
                { provide: PlayerService, useValue: playerServiceMock },
            ],
        });

        service = TestBed.inject(GameService);

        // Prépare un joueur de test et une configuration de carte minimale
        testPlayer = { id: 'p-test', avatar: 'Wizard', position: { x: 1, y: 1 } };
        // Cellule adjacente à (1,1): distance de Manhattan = 1
        adjacentCell = { position: { x: 2, y: 1 } };
        // Cellule non adjacente: distance > 1
        nonAdjacentCell = { position: { x: 3, y: 3 } };
        // Cellule téléportable : pas de joueur et tile différent de WALL, CLOSED_DOOR, OPENED_DOOR
        teleportableCell = { player: undefined, tile: 'FLOOR', position: { x: 0, y: 0 } };
        // Cellule non téléportable : par exemple, tile = WALL
        nonTeleportableCell = { player: undefined, tile: Tile.WALL, position: { x: 0, y: 1 } };

        //         // Pour tester initFight, préparer playingPlayers
        service.playingPlayers.next([testPlayer]);
        //         // Initialiser le jeu pour définir accessCode et organizerId
        service.setGame({
            map: [[]],
            players: [testPlayer],
            currentTurn: 0,
            accessCode: dummyAccessCode,
            organizerId: dummyOrganizer,
        } as any);
    });

    it('devrait être créé', () => {
        expect(service).toBeTruthy();
    });

    it('should set game correctly', () => {
        const testPlayers = [{ id: 'p1', avatar: Avatar.Knight } as PlayerStats];
        const testGame = { map: [[{} as Cell]], players: testPlayers, currentTurn: 0, accessCode: '0000', organizerId: 'org' } as Game;

        service.setGame(testGame);

        expect(service.playingPlayers.value).toBe(testPlayers);
        expect(service.activePlayer.value).toBe(testPlayers[0]);
        expect(service.getAccessCode()).toBe('0000');
    });

    it('should remove player if in game', () => {
        const testPlayer = { id: 'p1' } as PlayerStats;
        service.playingPlayers.next([testPlayer]);
        service.removePlayerInGame(testPlayer);
        expect(service.playingPlayers.value.length).toBe(0);
    });

    it('should not remove player if not in game', () => {
        const testPlayer = { id: 'p1' } as PlayerStats;
        service.playingPlayers.next([]);
        service.removePlayerInGame(testPlayer);
        expect(service.playingPlayers.value.length).toBe(0);
    });

    it('should update turn (activePlayer)', () => {
        const player = { id: 'p2' } as PlayerStats;
        service.updateTurn(player);
        expect(service.activePlayer.value).toBe(player);
    });

    it('should toggle action mode', () => {
        const oldValue = service.isActionSelected.value;
        service.toggleActionMode();
        expect(service.isActionSelected.value).toBe(!oldValue);
    });

    it('should call onMove and update map/activePlayer', () => {
        const prevPos = { x: 0, y: 0 };
        const player = { id: 'p-test', avatar: 'Wizard', position: { x: 1, y: 1 } } as PlayerStats;
        playerServiceMock.isActive.and.returnValue(true);
        playerServiceMock.getPlayer.and.returnValue(player);

        // On crée un tableau 2D pouvant gérer les positions (0,0) et (1,1)
        const initialMap: Cell[][] = [
            [
                {
                    player: Avatar.Wizard,
                    position: { x: 0, y: 0 },
                    tile: 'Floor',
                    item: Item.DEFAULT,
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

    it('should end turn and toggle action mode', () => {
        spyOn(socketServiceMock, 'endTurn');
        const oldValue = service.isActionSelected.value;

        service.endTurn();

        expect(service.isActionSelected.value).toBe(!oldValue);
        // Vérifie que la méthode endTurn du MockSocketService a été appelée
        expect(socketServiceMock.endTurn).toHaveBeenCalled();
    });

    it('should confirm and abandon game (resolve true)', async () => {
        const dialogRefMock = jasmine.createSpyObj('MatDialogRef<ConfirmationDialogComponent>>', ['afterClosed']);
        dialogRefMock.afterClosed.and.returnValue(new BehaviorSubject<boolean>(true));
        dialogMock.open.and.returnValue(dialogRefMock);

        const result = await service.confirmAndAbandonGame();
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
        // Arrange: faire en sorte que getPlayer retourne testPlayer
        playerServiceMock.getPlayer.and.returnValue(testPlayer);
        // Ajoute un autre joueur possédant l\'avatar recherché pour initFight
        const defender = {
            id: 'p-def',
            name: 'Defender',
            avatar: Avatar.Knight,
            attack: 4,
            defense: 4,
            speed: 6,
            life: 4,
            attackDice: 'D4',
            defenseDice: 'D6',
            actions: 1,
            wins: 0,
            movementPts: 6,
            position: { x: 0, y: 0 },
            spawnPosition: { x: 1, y: 1 },
        } as PlayerStats;
        service.playingPlayers.next([testPlayer, defender]);
        spyOn(service['socketService'], 'initFight');

        // Act
        service.initFight(Avatar.Knight);

        // Assert
        expect(service['socketService'].initFight).toHaveBeenCalledWith(dummyAccessCode, testPlayer, defender);
    });

    it('should not init fight when no defender is found', () => {
        playerServiceMock.getPlayer.and.returnValue(testPlayer);
        // Seul testPlayer est présent et ne correspond pas à l\'avatar recherché
        service.playingPlayers.next([testPlayer]);
        spyOn(service['socketService'], 'initFight');

        service.initFight(Avatar.Knight);

        expect(service['socketService'].initFight).not.toHaveBeenCalled();
    });

    it('should return the defender if found (findDefender)', () => {
        const defender = {
            id: 'p-def',
            name: 'Defender',
            avatar: Avatar.Knight,
            attack: 4,
            defense: 4,
            speed: 6,
            life: 4,
            attackDice: 'D4',
            defenseDice: 'D6',
            actions: 1,
            wins: 0,
            movementPts: 6,
            position: { x: 0, y: 0 },
            spawnPosition: { x: 1, y: 1 },
        } as PlayerStats;
        service.playingPlayers.next([testPlayer, defender]);

        const result = service.findDefender(Avatar.Knight);
        expect(result).toEqual(defender);
    });

    it('should toggle action mode', () => {
        const current = service.isActionSelected.value;
        service.toggleActionMode();
        expect(service.isActionSelected.value).toBe(!current);
    });

    it('should call changeDoorState when toggling door', () => {
        const position = { x: 2, y: 2 };
        playerServiceMock.getPlayer.and.returnValue(testPlayer);
        spyOn(service['socketService'], 'changeDoorState');
        service.toggleDoor(position);
        expect(service['socketService'].changeDoorState).toHaveBeenCalledWith(dummyAccessCode, position, testPlayer);
    });

    it('should return true for isWithinActionRange when cell is adjacent', () => {
        // Définit le joueur actif à testPlayer
        service.activePlayer.next(testPlayer);
        // Position de testPlayer: {x:1, y:1}, adjacentCell: {x:2, y:1}
        const result = service.isWithinActionRange({ ...adjacentCell });
        expect(result).toBeTrue();
    });

    it('should return false for isWithinActionRange when cell is not adjacent', () => {
        service.activePlayer.next(testPlayer);
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
        spyOn(service['socketService'], 'debugMove');
        // Pour cell téléportable, canTeleport devrait retourner true
        service.debugMovePlayer(teleportableCell);
        expect(service['socketService'].debugMove).toHaveBeenCalledWith(
            dummyAccessCode,
            teleportableCell.position,
            undefined as unknown as PlayerStats,
        );
    });

    it('should not call debugMove if cell cannot be teleported (debugMovePlayer)', () => {
        spyOn(service['socketService'], 'debugMove');
        service.debugMovePlayer(nonTeleportableCell);
        expect(service['socketService'].debugMove).not.toHaveBeenCalled();
    });

    it('should toggle debug mode when player is admin (toggleDebugMode)', () => {
        playerServiceMock.isPlayerAdmin.and.returnValue(true);
        spyOn(service['socketService'], 'toggleDebugMode');
        service.toggleDebugMode();
        expect(service['socketService'].toggleDebugMode).toHaveBeenCalledWith(dummyAccessCode);
    });

    it('should not toggle debug mode when player is not admin (toggleDebugMode)', () => {
        playerServiceMock.isPlayerAdmin.and.returnValue(false);
        spyOn(service['socketService'], 'toggleDebugMode');
        service.toggleDebugMode();
        expect(service['socketService'].toggleDebugMode).not.toHaveBeenCalled();
    });

    it('should toggle isDebugMode on onDebugStateChange call', () => {
        const current = service.isDebugMode.value;
        service.onDebugStateChange();
        expect(service.isDebugMode.value).toBe(!current);
    });

    it('should update map tile when broadcast door event occurs', () => {
        const initialMap: Cell[][] = [
            [{ tile: Tile.FLOOR, position: { x: 0, y: 0 } } as Cell, { tile: Tile.FLOOR, position: { x: 1, y: 0 } } as Cell],
            [{ tile: Tile.FLOOR, position: { x: 0, y: 1 } } as Cell, { tile: Tile.FLOOR, position: { x: 1, y: 1 } } as Cell],
        ];
        service.map.next(initialMap);

        const payload = {
            position: { x: 1, y: 0 },
            newState: Tile.OPENED_DOOR,
        };

        socketServiceMock.triggerBroadcastDoor(payload);
        expect(service.map.value[0][1].tile).toBe(Tile.OPENED_DOOR);
    });

    it('should toggle action mode when end fight event is received', () => {
        const oldValue = service.isActionSelected.value;
        // Simuler l'événement onEndFight
        socketServiceMock.triggerEndFight({});
        expect(service.isActionSelected.value).toBe(!oldValue);
    });

    it('should call onMove and update map/activePlayer when broadcast move event is received', () => {
        // Préparer une carte 2x2
        const initialMap: Cell[][] = [
            [
                { player: Avatar.Wizard, tile: Tile.FLOOR, position: { x: 0, y: 0 } } as Cell,
                { player: Avatar.Default, tile: Tile.FLOOR, position: { x: 1, y: 0 } } as Cell,
            ],
            [
                { player: Avatar.Default, tile: Tile.FLOOR, position: { x: 0, y: 1 } } as Cell,
                { player: Avatar.Default, tile: Tile.FLOOR, position: { x: 1, y: 1 } } as Cell,
            ],
        ];
        service.map.next(initialMap);
        const prevPos = { x: 0, y: 0 };
        const movingPlayer: PlayerStats = {
            id: 'p-test',
            avatar: 'Wizard',
            position: { x: 1, y: 1 },
            name: 'TestPlayer',
        } as PlayerStats;
        playerServiceMock.getPlayer.and.returnValue(movingPlayer);

        initialMap[prevPos.y][prevPos.x].player = Avatar.Wizard;

        socketServiceMock.triggerBroadcastMove({ previousPosition: prevPos, player: movingPlayer });

        expect(service.map.value[prevPos.y][prevPos.x].player).toBe(Avatar.Default);
        expect(service.map.value[movingPlayer.position.y][movingPlayer.position.x].player).toBe('Wizard');
        expect(service.activePlayer.value).toEqual(movingPlayer);
    });

    it('should return player description when cell contains a player', () => {
        service.playingPlayers.next([testPlayer]);
        testPlayer.avatar = Avatar.Wizard;
        const cell: Cell = {
            player: testPlayer.avatar,
            tile: Tile.FLOOR,
            position: { x: 0, y: 0 },
        } as Cell;
        const expected = 'Joueur: ' + testPlayer.name + ' Avatar: Wizard';
        expect(service.getCellDescription(cell)).toEqual(expected);
    });

    it('should return tile description when cell has no player and no item', () => {
        const cell: Cell = {
            tile: Tile.FLOOR,
            position: { x: 0, y: 1 },
        } as Cell;
        const expected = service.getTileDescription(Tile.FLOOR);
        expect(service.getCellDescription(cell)).toEqual(expected);
    });

    it('should append item description when cell has an item', () => {
        spyOn(service, 'getTileDescription').and.returnValue('TileDesc');
        spyOn(service, 'getItemDescription').and.returnValue('ItemDesc');
        // Utiliser un item non default pour déclencher l'ajout de la description d'item
        const cell: Cell = {
            tile: Tile.FLOOR,
            item: Item.BOW,
            position: { x: 1, y: 2 },
        } as Cell;
        const expected = 'TileDesc, ItemDesc';
        expect(service.getCellDescription(cell)).toEqual(expected);
    });

    it('should append item description when cell has a non-default item', () => {
        spyOn(service, 'getTileDescription').and.returnValue('TileDesc');
        spyOn(service, 'getItemDescription').and.returnValue('ItemDesc');
        const cell: Cell = {
            tile: Tile.FLOOR,
            item: Item.BOW,
            position: { x: 1, y: 2 },
        } as Cell;
        const expected = 'TileDesc, ItemDesc';
        expect(service.getCellDescription(cell)).toEqual(expected);
    });

    it('should append item description when cell contains a non-default item', () => {
        spyOn(service, 'getTileDescription').and.returnValue('TileDesc');
        spyOn(service, 'getItemDescription').and.returnValue('ItemDesc');
        const nonDefaultItem = Item.BOW;
        const cell: Cell = {
            tile: Tile.FLOOR,
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
            tile: Tile.FLOOR,
            item: Item.DEFAULT, // Cette valeur est considérée comme default
            position: { x: 1, y: 2 },
        } as Cell;
        // Dans ce cas, la description ne doit contenir que la description du tile
        const expected = 'TileDesc';
        expect(service.getCellDescription(cell)).toEqual(expected);
        expect(service.getItemDescription).not.toHaveBeenCalled();
    });

    it('should return organizer id', () => {
        expect(service.getOrganizerId()).toEqual(dummyOrganizer);
    });

    it('should return item description when a description exists', () => {
        spyOn(ASSETS_DESCRIPTION, 'get').and.callFake((item: Item) => {
            // pour Item.BOW, on retournera une description personnalisée
            return item === Item.BOW ? 'Bow Description' : undefined;
        });
        const result = service.getItemDescription(Item.BOW);
        expect(result).toEqual('Bow Description');
    });

    it('should return default description when no description exists', () => {
        spyOn(ASSETS_DESCRIPTION, 'get').and.returnValue(undefined);
        const result = service.getItemDescription(Item.BOW);
        expect(result).toEqual('Aucune description');
    });
});
