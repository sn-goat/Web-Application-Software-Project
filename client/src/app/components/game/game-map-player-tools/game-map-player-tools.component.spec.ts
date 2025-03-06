import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { PlayerToolsService } from '@app/services/code/player-tools.service';
import { Item } from '@common/enums';
import { BehaviorSubject } from 'rxjs';
import { GameMapPlayerToolsComponent } from './game-map-player-tools.component';

describe('GameMapPlayerToolsComponent', () => {
    let component: GameMapPlayerToolsComponent;
    let fixture: ComponentFixture<GameMapPlayerToolsComponent>;
    let playerToolsServiceMock: jasmine.SpyObj<PlayerToolsService>;
    let itemsSubject: BehaviorSubject<Item[]>;
    let timerSubject: BehaviorSubject<string>;

    beforeEach(async () => {
        itemsSubject = new BehaviorSubject<Item[]>([]);
        timerSubject = new BehaviorSubject<string>('00:00');

        playerToolsServiceMock = jasmine.createSpyObj('PlayerToolsService', ['endTurn', 'performAction'], {
            items$: itemsSubject.asObservable(),
            timer$: timerSubject.asObservable(),
        });

        await TestBed.configureTestingModule({
            imports: [CommonModule, GameMapPlayerToolsComponent],
            providers: [{ provide: PlayerToolsService, useValue: playerToolsServiceMock }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameMapPlayerToolsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.items).toEqual([]);
        expect(component.timer).toEqual('00:00');
        expect(component.src).toEqual(DEFAULT_PATH_ITEMS);
        expect(component.fileType).toEqual(DEFAULT_FILE_TYPE);
    });

    it('should update items when items$ emits new values', () => {
        const newItems = [Item.SWORD, Item.BOW];
        itemsSubject.next(newItems);

        expect(component.items).toEqual(newItems);
    });

    it('should update timer when timer$ emits new values', () => {
        const newTimer = '01:30';
        timerSubject.next(newTimer);

        expect(component.timer).toEqual(newTimer);
    });

    it('should call endTurn on service when endTurn is called', () => {
        component.endTurn();

        expect(playerToolsServiceMock.endTurn).toHaveBeenCalledTimes(1);
    });

    it('should call performAction on service when performAction is called', () => {
        component.performAction();

        expect(playerToolsServiceMock.performAction).toHaveBeenCalledTimes(1);
    });
});
