/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GameService } from '@app/services/game/game.service';
import { IPlayer } from '@common/player';
import { BehaviorSubject, Subscription, of } from 'rxjs';
import { GameMapPlayerComponent } from './game-map-player.component';

describe('GameMapPlayerComponent', () => {
    let component: GameMapPlayerComponent;
    let fixture: ComponentFixture<GameMapPlayerComponent>;
    let gameServiceMock: any;
    let socketServiceMock: any;
    let currentPlayersSubject: BehaviorSubject<IPlayer[]>;
    let initialPlayersSubject: BehaviorSubject<IPlayer[]>;
    let activePlayerSubject: BehaviorSubject<IPlayer | null>;
    let unsubscribeSpy: jasmine.Spy;

    const mockPlayers = [
        {
            id: '1',
            name: 'player1',
            avatar: '1',
            life: 100,
            attackPower: 10,
            defensePower: 10,
            speed: 5,
            attackDice: 'D6',
            defenseDice: 'D4',
            movementPts: 5,
            actions: 2,
            wins: 0,
            position: { x: 0, y: 0 },
            spawnPosition: { x: 0, y: 0 },
        },
        {
            id: '2',
            name: 'player2',
            avatar: '2',
            life: 90,
            attackPower: 12,
            defensePower: 8,
            speed: 7,
            attackDice: 'D6',
            defenseDice: 'D4',
            movementPts: 4,
            actions: 1,
            wins: 0,
            position: { x: 0, y: 0 },
            spawnPosition: { x: 0, y: 0 },
        },
    ] as IPlayer[];

    const mockActivePlayer: IPlayer = mockPlayers[0];

    beforeEach(async () => {
        currentPlayersSubject = new BehaviorSubject<IPlayer[]>([]);
        initialPlayersSubject = new BehaviorSubject<IPlayer[]>([]);
        activePlayerSubject = new BehaviorSubject<IPlayer | null>(null);

        unsubscribeSpy = jasmine.createSpy('unsubscribe');

        gameServiceMock = {
            playingPlayers: currentPlayersSubject.asObservable(),
            initialPlayers: initialPlayersSubject.asObservable(),
            activePlayer: activePlayerSubject.asObservable(),
            getOrganizerId: () => 'organizer1',
        };

        socketServiceMock = jasmine.createSpyObj('SocketService', ['onWinner']);
        socketServiceMock.onWinner.and.returnValue(of(mockPlayers[0]));

        spyOn(Subscription.prototype, 'unsubscribe').and.callFake(() => {
            unsubscribeSpy();
            return undefined;
        });

        await TestBed.configureTestingModule({
            imports: [CommonModule, GameMapPlayerComponent],
            providers: [{ provide: GameService, useValue: gameServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapPlayerComponent);
        component = fixture.componentInstance;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update activePlayer when activePlayer$ emits', fakeAsync(() => {
        activePlayerSubject.next(mockActivePlayer);
        tick();
        fixture.detectChanges();
        expect(component.activePlayer).toEqual(mockActivePlayer);
    }));

    it('playerIsInGame should return true if a player is in the game', () => {
        currentPlayersSubject.next(mockPlayers);
        const check = component.isPlayerInGame(mockActivePlayer);
        expect(check).toBeTrue();
    });
});
