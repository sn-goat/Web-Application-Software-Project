/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BoardCellComponent } from '@app/components/common/board-cell/board-cell.component';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { Board, Cell } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';
import { Avatar, PathInfo } from '@common/game';
import { BehaviorSubject } from 'rxjs';
import { GameMapComponent } from './game-map.component';

describe('GameMapComponent', () => {
    let component: GameMapComponent;
    let fixture: ComponentFixture<GameMapComponent>;
    let gameMapServiceMock: jasmine.SpyObj<any>;
    let boardSubject: BehaviorSubject<Board>;

    // Mocks pour les services utilisés dans GameMapComponent
    let playerServiceMock: any;
    let gameServiceMock: any;
    let fightLogicServiceMock: any;

    const mockBoard: Board = {
        name: 'Test Board',
        description: 'Test board description',
        size: 10,
        isCTF: false,
        board: Array(10)
            .fill(null)
            .map(() =>
                Array(10)
                    .fill(null)
                    .map(
                        () =>
                            ({
                                position: { x: 0, y: 0 },
                                tile: Tile.FLOOR,
                                item: Item.DEFAULT,
                            }) as Cell,
                    ),
            ),
        visibility: Visibility.PUBLIC,
    };

    beforeEach(async () => {
        boardSubject = new BehaviorSubject<Board>(mockBoard);
        gameMapServiceMock = jasmine.createSpyObj('GameMapService', ['getGameMap']);
        gameMapServiceMock.getGameMap.and.returnValue(boardSubject);

        // Création des mocks pour PlayerService, GameService et FightLogicService
        playerServiceMock = {
            isActivePlayer: new BehaviorSubject(false),
            path: new BehaviorSubject<Map<string, PathInfo> | null>(null),
            sendMove: jasmine.createSpy('sendMove'),
            getPlayer: jasmine.createSpy('getPlayer').and.returnValue({ 
                id: 'player1', 
                position: { x: 5, y: 5 },
                spawnPosition: { x: 5, y: 5 },
                inventory: [] 
            })};
        gameServiceMock = {
            isWithinActionRange: jasmine.createSpy('isWithinActionRange'),
            initFight: jasmine.createSpy('initFight'),
            toggleDoor: jasmine.createSpy('toggleDoor'),
            debugMovePlayer: jasmine.createSpy('debugMovePlayer'),
            getCellDescription: jasmine.createSpy('getCellDescription'),
            // Pour la subscription map
            map: new BehaviorSubject<Cell[][]>([]),
            // Ajout des propriétés manquantes :
            isActionSelected: new BehaviorSubject<boolean>(false),
            isDebugMode: new BehaviorSubject<boolean>(false),
        };
        fightLogicServiceMock = {
            isAttackProvocation: jasmine.createSpy('isAttackProvocation'),
        };

        await TestBed.configureTestingModule({
            imports: [CommonModule, GameMapComponent, BoardCellComponent],
            providers: [
                { provide: GameMapService, useValue: gameMapServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
                { provide: GameService, useValue: gameServiceMock },
                { provide: FightLogicService, useValue: fightLogicServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('PlayerService.path subscription', () => {
        it('should reset path related properties when path is null', fakeAsync(() => {
            // Initialiser des valeurs pour vérifier qu'elles sont réinitialisées
            component.path = new Map<string, PathInfo>([['dummy', { path: [], cost: 0 }]]);
            component.pathCells.add('dummy');
            component.highlightedPathCells.add('dummy');
            component.rightSelectedCell = { position: { x: 0, y: 0 }, tile: Tile.FLOOR } as Cell;

            // Émettre une valeur null sur le BehaviorSubject
            playerServiceMock.path.next(null);
            tick();
            fixture.detectChanges();

            expect(component.path).toBeNull();
            expect(component.pathCells.size).toBe(0);
            expect(component.highlightedPathCells.size).toBe(0);
            expect(component.rightSelectedCell).toBeNull();
        }));

        it('should update path, pathCells and keep rightSelectedCell null when a valid path is provided', () => {
            const key = '1,2';
            const pathInfo: PathInfo = { path: [{ x: 3, y: 4 }], cost: 0 };
            const newPath = new Map<string, PathInfo>([[key, pathInfo]]);
            // Avant émission, assurez-vous que rightSelectedCell est non nul
            component.rightSelectedCell = { position: { x: 99, y: 99 }, tile: Tile.FLOOR } as Cell;

            playerServiceMock.path.next(newPath);
            fixture.detectChanges();

            expect(component.path).not.toBeNull();
            expect(component.path?.has(key)).toBeTrue();
            expect(Array.from(component.pathCells)).toContain(key);
            // La souscription réinitialise rightSelectedCell
            expect(component.rightSelectedCell).toBeNull();
        });
    });

    describe('onLeftClicked', () => {
        let cell: Cell;
        beforeEach(() => {
            cell = { position: { x: 5, y: 5 }, tile: Tile.FLOOR, item: Item.DEFAULT } as Cell;
        });

        it('should do nothing if not player turn', () => {
            component.isPlayerTurn = false;
            component.onLeftClicked(cell);
            expect(playerServiceMock.sendMove).not.toHaveBeenCalled();
        });

        it('should call gameService.initFight when action selected, within range, and attack provocation is true', () => {
            component.isPlayerTurn = true;
            component.isActionSelected = true;
            gameServiceMock.isWithinActionRange.and.returnValue(true);
            fightLogicServiceMock.isAttackProvocation.and.returnValue(true);
            // Ajouter une propriété player au cell pour simuler le joueur ciblé
            cell = { ...cell, player: { id: 'player1', name: 'Player One', health: 100 } as unknown as Avatar };

            component.onLeftClicked(cell);
            expect(gameServiceMock.initFight).toHaveBeenCalledWith(cell.player);
        });

        it('should call gameService.toggleDoor when action selected, within range, not attack provocation and cell tile is OPENED_DOOR', () => {
            component.isPlayerTurn = true;
            component.isActionSelected = true;
            gameServiceMock.isWithinActionRange.and.returnValue(true);
            fightLogicServiceMock.isAttackProvocation.and.returnValue(false);
            cell.tile = Tile.OPENED_DOOR;

            component.onLeftClicked(cell);
            expect(gameServiceMock.toggleDoor).toHaveBeenCalledWith(cell.position);
        });

        it('should call playerService.sendMove when action not selected or not within range', () => {
            component.isPlayerTurn = true;
            component.isActionSelected = false;
            component.onLeftClicked(cell);
            expect(playerServiceMock.sendMove).toHaveBeenCalledWith(cell.position);
        });
    });

    describe('onRightClicked', () => {
        let cell: Cell;
        beforeEach(() => {
            cell = { position: { x: 2, y: 3 }, tile: Tile.FLOOR, item: Item.DEFAULT } as Cell;
        });

        it('should call gameService.debugMovePlayer when debug mode is on and it is player turn', () => {
            component.isDebugMode = true;
            component.isPlayerTurn = true;
            component.onRightClicked(cell);
            expect(gameServiceMock.debugMovePlayer).toHaveBeenCalledWith(cell);
        });

        it('should set rightSelectedCell to null if clicked cell matches existing rightSelectedCell', () => {
            component.isDebugMode = false;
            component.isPlayerTurn = true;
            // Définir rightSelectedCell initial
            component.rightSelectedCell = { ...cell };
            component.onRightClicked(cell);
            expect(component.rightSelectedCell).toBeNull();
        });

        it('should set rightSelectedCell to the clicked cell if it does not match current one', () => {
            component.isDebugMode = false;
            component.isPlayerTurn = true;
            const anotherCell: Cell = { position: { x: 4, y: 5 }, tile: Tile.FLOOR, item: Item.DEFAULT } as Cell;
            component.rightSelectedCell = { ...cell };
            component.onRightClicked(anotherCell);
            expect(component.rightSelectedCell).toEqual(anotherCell);
        });
    });

    describe('Tooltip and path utility methods', () => {
        let cell: Cell;
        beforeEach(() => {
            cell = { position: { x: 7, y: 8 }, tile: Tile.FLOOR, item: Item.DEFAULT } as Cell;
        });

        it('getTooltipContent should return description from gameService', () => {
            gameServiceMock.getCellDescription.and.returnValue('Cell description');
            const result = component.getTooltipContent(cell);
            expect(result).toBe('Cell description');
            expect(gameServiceMock.getCellDescription).toHaveBeenCalledWith(cell);
        });

        it('getCellTooltip should return tooltip when rightSelectedCell matches cell', () => {
            component.rightSelectedCell = { ...cell };
            gameServiceMock.getCellDescription.and.returnValue('Tooltip text');
            const result = component.getCellTooltip(cell);
            expect(result).toBe('Tooltip text');
        });

        it('getCellTooltip should return null when rightSelectedCell does not match cell', () => {
            component.rightSelectedCell = { position: { x: 0, y: 0 }, tile: Tile.FLOOR, item: Item.DEFAULT } as Cell;
            const result = component.getCellTooltip(cell);
            expect(result).toBeNull();
        });

        it('isPathCell should return true if cell position key exists in pathCells', () => {
            component.pathCells.add(`${cell.position.x},${cell.position.y}`);
            expect(component.isPathCell(cell)).toBeTrue();
        });

        it('isHighlightedPathCell should return true if cell position key exists in highlightedPathCells', () => {
            component.highlightedPathCells.add(`${cell.position.x},${cell.position.y}`);
            expect(component.isHighlightedPathCell(cell)).toBeTrue();
        });

        it('onCellHovered should update highlightedPathCells if path exists and player turn is true', () => {
            component.isPlayerTurn = true;
            // Préparer un path avec une clé correspondant à la position du cell
            const key = `${cell.position.x},${cell.position.y}`;
            const pathInfo: PathInfo = {
                path: [
                    { x: 10, y: 10 },
                    { x: 20, y: 20 },
                ],
                cost: 0,
            };
            const newPath = new Map<string, PathInfo>([[key, pathInfo]]);
            component.path = new Map(newPath);
            component.pathCells = new Set(newPath.keys());
            // S'assurer que highlightedPathCells est vide avant
            component.highlightedPathCells.clear();

            component.onCellHovered(cell);
            expect(Array.from(component.highlightedPathCells)).toEqual(pathInfo.path.map((vec) => `${vec.x},${vec.y}`));
        });

        it('onCellHovered should clear highlightedPathCells if path does not contain cell key', () => {
            component.isPlayerTurn = true;
            component.path = new Map(); // aucun chemin
            component.highlightedPathCells.add('dummy');
            component.onCellHovered(cell);
            expect(component.highlightedPathCells.size).toBe(0);
        });

        it('onCellUnhovered should clear highlightedPathCells', () => {
            component.highlightedPathCells.add('dummy');
            component.onCellUnhovered();
            expect(component.highlightedPathCells.size).toBe(0);
        });
    });

    describe('HostListener: handleKeyboardEvent', () => {
        it('should call toggleDebugMode and prevent default when key "d" is pressed', () => {
            // Préparez l'événement en espionnant preventDefault
            const keyEvent = jasmine.createSpyObj('KeyboardEvent', ['preventDefault']);
            keyEvent.key = 'd';
            // Ajoutez la méthode toggleDebugMode dans le mock de gameService, si non déjà présente
            gameServiceMock.toggleDebugMode = jasmine.createSpy('toggleDebugMode');

            // Appel du HostListener
            component.handleKeyboardEvent(keyEvent as unknown as KeyboardEvent);

            expect(keyEvent.preventDefault).toHaveBeenCalled();
            expect(gameServiceMock.toggleDebugMode).toHaveBeenCalled();
        });
    });
});
