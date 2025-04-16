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

// ... all imports remain unchanged

describe('GameMapComponent', () => {
    let component: GameMapComponent;
    let fixture: ComponentFixture<GameMapComponent>;
    let gameMapServiceMock: jasmine.SpyObj<any>;
    let boardSubject: BehaviorSubject<Board>;

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
                    .map(() => ({ position: { x: 0, y: 0 }, tile: Tile.Floor, item: Item.Default }) as Cell),
            ),
        visibility: Visibility.Public,
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
                inventory: [],
            }),
        };
        gameServiceMock = {
            isWithinActionRange: jasmine.createSpy('isWithinActionRange'),
            initFight: jasmine.createSpy('initFight'),
            toggleDoor: jasmine.createSpy('toggleDoor'),
            debugMovePlayer: jasmine.createSpy('debugMovePlayer'),
            getCellDescription: jasmine.createSpy('getCellDescription'),
            map: new BehaviorSubject<Cell[][]>([]),
            isActionSelected: new BehaviorSubject<boolean>(false),
            isDebugMode: new BehaviorSubject<boolean>(false),
            toggleDebugMode: jasmine.createSpy('toggleDebugMode'),
            findPossibleActions: jasmine.createSpy('findPossibleActions').and.returnValue(new Set<string>(['0,0'])),
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
        it('should clear path-related state when path is null', fakeAsync(() => {
            playerServiceMock.path.next(null);
            tick();
            fixture.detectChanges();

            const dummyCell = { position: { x: 0, y: 0 }, tile: Tile.Floor } as Cell;
            expect(component.getCellTooltip(dummyCell)).toBeNull();
            expect(component.isPathCell(dummyCell)).toBeFalse();
            expect(component.isHighlightedPathCell(dummyCell)).toBeFalse();
        }));

        it('should update path-related state on valid path', fakeAsync(() => {
            const key = '1,2';
            const pathInfo: PathInfo = { path: [{ x: 3, y: 4 }], cost: 0 };
            const newPath = new Map<string, PathInfo>([[key, pathInfo]]);
            playerServiceMock.path.next(newPath);
            tick();
            fixture.detectChanges();

            const testCell = { position: { x: 1, y: 2 }, tile: Tile.Floor } as Cell;
            expect(component.isPathCell(testCell)).toBeTrue();
        }));
    });

    describe('onLeftClicked', () => {
        const cell: Cell = { position: { x: 5, y: 5 }, tile: Tile.Floor, item: Item.Default } as Cell;

        it('should not call anything if not player turn', () => {
            component.onLeftClicked(cell);
            expect(playerServiceMock.sendMove).not.toHaveBeenCalled();
        });

        it('should call initFight if action selected and isAttackProvocation is true', () => {
            gameServiceMock.isActionSelected.next(true);
            gameServiceMock.isWithinActionRange.and.returnValue(true);
            fightLogicServiceMock.isAttackProvocation.and.returnValue(true);
            cell.player = Avatar.Berserker as Avatar;
            playerServiceMock.isActivePlayer.next(true);
            fixture.detectChanges();

            component.onLeftClicked(cell);
            expect(gameServiceMock.initFight).toHaveBeenCalledWith(cell.player);
        });

        it('should call toggleDoor if door is clicked during action', () => {
            gameServiceMock.isActionSelected.next(true);
            gameServiceMock.isWithinActionRange.and.returnValue(true);
            fightLogicServiceMock.isAttackProvocation.and.returnValue(false);
            cell.tile = Tile.OpenedDoor;
            playerServiceMock.isActivePlayer.next(true);
            fixture.detectChanges();

            component.onLeftClicked(cell);
            expect(gameServiceMock.toggleDoor).toHaveBeenCalledWith(cell.position);
        });

        it('should call sendMove if not action selected', () => {
            playerServiceMock.isActivePlayer.next(true);
            fixture.detectChanges();

            component.onLeftClicked(cell);
            expect(playerServiceMock.sendMove).toHaveBeenCalledWith(cell.position);
        });
    });

    describe('onRightClicked and getCellTooltip', () => {
        const cell = { position: { x: 1, y: 1 }, tile: Tile.Floor, item: Item.Default } as Cell;

        it('should toggle selected cell on right click', () => {
            playerServiceMock.isActivePlayer.next(true);
            fixture.detectChanges();

            component.onRightClicked(cell);
            expect(component.getCellTooltip(cell)).toBeUndefined();

            component.onRightClicked(cell);
            expect(component.getCellTooltip(cell)).toBeNull();
        });

        it('should call debugMovePlayer when debug mode is active', () => {
            playerServiceMock.isActivePlayer.next(true);
            gameServiceMock.isDebugMode.next(true);
            fixture.detectChanges();

            component.onRightClicked(cell);
            expect(gameServiceMock.debugMovePlayer).toHaveBeenCalledWith(cell);
        });
    });

    describe('onCellHovered and onCellUnhovered', () => {
        it('should highlight path if cell is on path', () => {
            const key = '1,2';
            const pathInfo: PathInfo = { path: [{ x: 9, y: 9 }], cost: 1 };
            const cell = { position: { x: 1, y: 2 }, tile: Tile.Floor } as Cell;

            playerServiceMock.isActivePlayer.next(true);
            playerServiceMock.path.next(new Map([[key, pathInfo]]));
            fixture.detectChanges();

            component.onCellHovered(cell);
            expect(component.isHighlightedPathCell({ position: { x: 9, y: 9 }, tile: Tile.Floor } as Cell)).toBeTrue();
        });

        it('should clear highlight when cell not on path', () => {
            const cell = { position: { x: 2, y: 3 }, tile: Tile.Floor } as Cell;

            playerServiceMock.isActivePlayer.next(true);
            playerServiceMock.path.next(new Map());
            fixture.detectChanges();

            component.onCellHovered(cell);
            expect(component.isHighlightedPathCell(cell)).toBeFalse();
        });

        it('should clear highlight on unhover', () => {
            component.onCellUnhovered();
            expect(component.isHighlightedPathCell({ position: { x: 0, y: 0 }, tile: Tile.Floor } as Cell)).toBeFalse();
        });
    });

    describe('handleKeyboardEvent', () => {
        it('should call toggleDebugMode on D key press', () => {
            const mockEvent = new KeyboardEvent('keydown', { key: 'd' });
            spyOn(mockEvent, 'preventDefault');
            component.handleKeyboardEvent(mockEvent);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(gameServiceMock.toggleDebugMode).toHaveBeenCalled();
        });
    });
});
