/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardCellComponent } from '@app/components/edit/board-cell/board-cell.component';
import { GameMapService } from '@app/services/code/game-map.service';
import { Board, Cell } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';
import { BehaviorSubject, Subscription } from 'rxjs';
import { GameMapComponent } from './game-map.component';

describe('GameMapComponent', () => {
    let component: GameMapComponent;
    let fixture: ComponentFixture<GameMapComponent>;
    let gameMapServiceMock: jasmine.SpyObj<GameMapService>;
    let boardSubject: BehaviorSubject<Board>;
    let unsubscribeSpy: jasmine.Spy;

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
        image: 'test-image.png',
    };

    beforeEach(async () => {
        unsubscribeSpy = jasmine.createSpy('unsubscribe');

        boardSubject = new BehaviorSubject<Board>(mockBoard);

        gameMapServiceMock = jasmine.createSpyObj('GameMapService', ['getGameMap']);

        gameMapServiceMock.getGameMap.and.returnValue(boardSubject);

        spyOn(Subscription.prototype, 'unsubscribe').and.callFake(() => {
            unsubscribeSpy();
            return undefined;
        });

        await TestBed.configureTestingModule({
            imports: [CommonModule, GameMapComponent, BoardCellComponent],
            providers: [{ provide: GameMapService, useValue: gameMapServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapComponent);
        component = fixture.componentInstance;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize boardGame from service in ngOnInit', () => {
        expect(gameMapServiceMock.getGameMap).toHaveBeenCalled();
        expect(component.boardGame).toEqual(mockBoard);
    });

    it('should update boardGame when service emits new board', () => {
        const updatedBoard: Board = {
            name: 'Updated Board',
            description: 'Updated description',
            size: 12,
            isCTF: true,
            board: Array(12)
                .fill(null)
                .map(() =>
                    Array(12)
                        .fill(null)
                        .map(
                            () =>
                                ({
                                    position: { x: 0, y: 0 },
                                    tile: Tile.WALL,
                                    item: Item.SWORD,
                                }) as Cell,
                        ),
                ),
            visibility: Visibility.PRIVATE,
            image: 'updated-image.png',
        };

        boardSubject.next(updatedBoard);

        expect(component.boardGame).toEqual(updatedBoard);
    });

    it('should unsubscribe when component is destroyed', () => {
        unsubscribeSpy.calls.reset();

        expect((component as any).boardSubscription).toBeDefined();

        component.ngOnDestroy();

        expect(unsubscribeSpy).toHaveBeenCalled();
    });
});
