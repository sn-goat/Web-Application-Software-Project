/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_AVATARS } from '@app/constants/path';
import { FightLogicService } from '@app/services/code/fight-logic.service';
import { PlayerService } from '@app/services/code/player.service';
import { Player } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { GameFightInterfaceComponent } from '@app/components/game/game-fight-interface/game-fight-interface.component';

describe('GameFightInterfaceComponent', () => {
    let component: GameFightInterfaceComponent;
    let fixture: ComponentFixture<GameFightInterfaceComponent>;
    let fightLogicServiceMock: jasmine.SpyObj<FightLogicService>;
    let playerServiceMock: jasmine.SpyObj<PlayerService>;

    let timerSubject: BehaviorSubject<string>;
    let d4Subject: BehaviorSubject<number>;
    let d6Subject: BehaviorSubject<number>;
    let turnSubject: BehaviorSubject<string>;
    let fleeAttempt1Subject: BehaviorSubject<number>;
    let fleeAttempt2Subject: BehaviorSubject<number>;

    const mockPlayer1: Player = {
        id: '1',
        username: 'player1',
        avatar: '1',
        life: 100,
        attack: 10,
        defense: 10,
        rapidity: 5,
        attackDice: 'd6',
        defenseDice: 'd4',
        movementPts: 5,
        actions: 2,
    };

    const mockPlayer2: Player = {
        id: '2',
        username: 'player2',
        avatar: '2',
        life: 90,
        attack: 12,
        defense: 8,
        rapidity: 7,
        attackDice: 'd8',
        defenseDice: 'd6',
        movementPts: 4,
        actions: 1,
    };

    beforeEach(async () => {
        timerSubject = new BehaviorSubject<string>('00:00');
        d4Subject = new BehaviorSubject<number>(0);
        d6Subject = new BehaviorSubject<number>(0);
        turnSubject = new BehaviorSubject<string>('');
        fleeAttempt1Subject = new BehaviorSubject<number>(2);
        fleeAttempt2Subject = new BehaviorSubject<number>(2);

        fightLogicServiceMock = jasmine.createSpyObj('FightLogicService', ['attack', 'flee', 'getUsername1', 'getUsername2'], {
            timer$: timerSubject.asObservable(),
            d4$: d4Subject.asObservable(),
            d6$: d6Subject.asObservable(),
            turn$: turnSubject.asObservable(),
            fleeAttempt1$: fleeAttempt1Subject.asObservable(),
            fleeAttempt2$: fleeAttempt2Subject.asObservable(),
        });

        fightLogicServiceMock.getUsername1.and.returnValue('player1');
        fightLogicServiceMock.getUsername2.and.returnValue('player2');

        playerServiceMock = jasmine.createSpyObj('PlayerService', ['getPlayer', 'getPlayerUsername']);

        playerServiceMock.getPlayerUsername.and.returnValue('player1'); // Current player is player1
        playerServiceMock.getPlayer.and.callFake((username: string) => {
            if (username === 'player1') return mockPlayer1;
            if (username === 'player2') return mockPlayer2;
            return undefined;
        });

        await TestBed.configureTestingModule({
            imports: [CommonModule, MatButtonModule, GameFightInterfaceComponent],
            providers: [
                { provide: FightLogicService, useValue: fightLogicServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameFightInterfaceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize constant paths', () => {
        expect(component.srcAvatar).toBe(DEFAULT_PATH_AVATARS);
        expect(component.fileType).toBe(DEFAULT_FILE_TYPE);
    });

    it('should initialize with default values', () => {
        expect(component.timer).toBe('00:00');
        expect(component.diceD4).toBe(0);
        expect(component.diceD6).toBe(0);
        expect(component.currentTurn).toBe('');
        expect(component.fleeAttempt1).toBe(2);
        expect(component.fleeAttempt2).toBe(2);
    });

    it('should initialize player1 and player2 in ngOnInit', () => {
        expect(fightLogicServiceMock.getUsername1).toHaveBeenCalled();
        expect(fightLogicServiceMock.getUsername2).toHaveBeenCalled();
        expect(playerServiceMock.getPlayer).toHaveBeenCalledWith('player1');
        expect(playerServiceMock.getPlayer).toHaveBeenCalledWith('player2');
        expect(component.player1).toEqual(mockPlayer1);
        expect(component.player2).toEqual(mockPlayer2);
    });

    it('should update timer when timer$ emits', () => {
        const newTime = '01:30';
        timerSubject.next(newTime);
        expect(component.timer).toBe(newTime);
    });

    it('should update dice values when dice observables emit', () => {
        d4Subject.next(3);
        expect(component.diceD4).toBe(3);

        d6Subject.next(5);
        expect(component.diceD6).toBe(5);
    });

    it('should update currentTurn and players when turn$ emits', () => {
        playerServiceMock.getPlayer.calls.reset();
        fightLogicServiceMock.getUsername1.calls.reset();
        fightLogicServiceMock.getUsername2.calls.reset();

        turnSubject.next('player2');

        expect(component.currentTurn).toBe('player2');

        expect(fightLogicServiceMock.getUsername1).toHaveBeenCalled();
        expect(fightLogicServiceMock.getUsername2).toHaveBeenCalled();
        expect(playerServiceMock.getPlayer).toHaveBeenCalledWith('player1');
        expect(playerServiceMock.getPlayer).toHaveBeenCalledWith('player2');
    });

    it('should update fleeAttempts when fleeAttempt$ subjects emit', () => {
        fleeAttempt1Subject.next(1);
        expect(component.fleeAttempt1).toBe(1);

        fleeAttempt2Subject.next(0);
        expect(component.fleeAttempt2).toBe(0);
    });

    it('should unsubscribe from all observables on destroy', () => {
        const nextSpy = spyOn(component['destroy$'], 'next').and.callThrough();
        const completeSpy = spyOn(component['destroy$'], 'complete').and.callThrough();

        component.ngOnDestroy();

        expect(nextSpy).toHaveBeenCalled();
        expect(completeSpy).toHaveBeenCalled();
    });

    it('should return true for isMyTurn when currentTurn matches player username', () => {
        component.currentTurn = 'player1';

        expect(component.isMyTurn()).toBeTrue();
        expect(playerServiceMock.getPlayerUsername).toHaveBeenCalled();
    });

    it('should return false for isMyTurn when currentTurn does not match player username', () => {
        component.currentTurn = 'player2';

        expect(component.isMyTurn()).toBeFalse();
        expect(playerServiceMock.getPlayerUsername).toHaveBeenCalled();
    });

    it("should call fightLogicService.flee when flee is called and it is player's turn", () => {
        component.currentTurn = 'player1';

        component.flee();

        expect(fightLogicServiceMock.flee).toHaveBeenCalledWith('player1');
    });

    it("should not call fightLogicService.flee when flee is called but it is not player's turn", () => {
        component.currentTurn = 'player2';

        component.flee();

        expect(fightLogicServiceMock.flee).not.toHaveBeenCalled();
    });

    it("should call fightLogicService.attack when attack is called and it is player's turn", () => {
        component.currentTurn = 'player1';

        component.attack();

        expect(fightLogicServiceMock.attack).toHaveBeenCalledWith('player1');
    });

    it("should not call fightLogicService.attack when attack is called but it is not player's turn", () => {
        component.currentTurn = 'player2';

        component.attack();

        expect(fightLogicServiceMock.attack).not.toHaveBeenCalled();
    });

    it('should return correct flee attempts for player1', () => {
        component.player1 = mockPlayer1;
        component.fleeAttempt1 = 1;

        expect(component.getFleeAttempts('player1')).toBe(1);
    });

    it('should return correct flee attempts for player2', () => {
        component.player2 = mockPlayer2;
        component.fleeAttempt2 = 0;

        expect(component.getFleeAttempts('player2')).toBe(0);
    });

    it('should return 0 for getFleeAttempts when username does not match either player', () => {
        expect(component.getFleeAttempts('unknown')).toBe(0);
    });

    it('should handle undefined players in getFleeAttempts', () => {
        component.player1 = undefined;
        component.player2 = undefined;

        expect(component.getFleeAttempts('player1')).toBe(0);
        expect(component.getFleeAttempts('player2')).toBe(0);
    });

    it('should handle case where player gets undefined from service in ngOnInit', () => {
        playerServiceMock.getPlayer.and.returnValue(undefined);

        const newFixture = TestBed.createComponent(GameFightInterfaceComponent);
        const newComponent = newFixture.componentInstance;

        newFixture.detectChanges();

        expect(newComponent.player1).toBeUndefined();
        expect(newComponent.player2).toBeUndefined();
        expect(() => newComponent.getFleeAttempts('player1')).not.toThrow();
    });
});
