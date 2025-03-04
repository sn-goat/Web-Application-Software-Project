/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { FightLogicService } from '@app/services/code/fight-logic.service';
import { PlayerService } from '@app/services/code/player.service';
import { Player } from '@common/player';

describe('FightLogicService', () => {
    let service: FightLogicService;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('PlayerService', ['getPlayer']);

        TestBed.configureTestingModule({
            providers: [FightLogicService, { provide: PlayerService, useValue: spy }],
        });

        service = TestBed.inject(FightLogicService);
        playerServiceSpy = TestBed.inject(PlayerService) as jasmine.SpyObj<PlayerService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with empty usernames and default values', () => {
        expect(service.getUsername1()).toBe('');
        expect(service.getUsername2()).toBe('');

        let d4Value: number | undefined;
        service.d4$.subscribe((val) => (d4Value = val));
        expect(d4Value).toBe(0);

        let d6Value: number | undefined;
        service.d6$.subscribe((val) => (d6Value = val));
        expect(d6Value).toBe(0);

        let timerValue: string | undefined;
        service.timer$.subscribe((val) => (timerValue = val));
        expect(timerValue).toBe('00:00');

        let turnValue: string | undefined;
        service.turn$.subscribe((val) => (turnValue = val));
        expect(turnValue).toBe('');

        let fleeAttempt1Value: number | undefined;
        service.fleeAttempt1$.subscribe((val) => (fleeAttempt1Value = val));
        expect(fleeAttempt1Value).toBe(2);

        let fleeAttempt2Value: number | undefined;
        service.fleeAttempt2$.subscribe((val) => (fleeAttempt2Value = val));
        expect(fleeAttempt2Value).toBe(2);

        let fightStartedValue: boolean | undefined;
        service.fightStarted$.subscribe((val) => (fightStartedValue = val));
        expect(fightStartedValue).toBe(false);
    });

    it('should update d4 value when rollDiceD4 is called', () => {
        let d4Value: number | undefined;
        service.d4$.subscribe((val) => (d4Value = val));

        service.rollDiceD4(4);
        expect(d4Value).toBe(4);
    });

    it('should update d6 value when rollDiceD6 is called', () => {
        let d6Value: number | undefined;
        service.d6$.subscribe((val) => (d6Value = val));

        service.rollDiceD6(6);
        expect(d6Value).toBe(6);
    });

    it('should update timer value when setTimer is called', () => {
        let timerValue: string | undefined;
        service.timer$.subscribe((val) => (timerValue = val));

        service.setTimer('01:30');
        expect(timerValue).toBe('01:30');
    });

    it('should update turn value when setTurn is called', () => {
        let turnValue: string | undefined;
        service.turn$.subscribe((val) => (turnValue = val));

        service.setTurn('Player1');
        expect(turnValue).toBe('Player1');
    });

    it('should update fleeAttempt1 when setFleeAttempt is called with username1', () => {
        service['username1'] = 'Player1';
        service['username2'] = 'Player2';

        let fleeAttempt1Value: number | undefined;
        service.fleeAttempt1$.subscribe((val) => (fleeAttempt1Value = val));

        service.setFleeAttempt({ username: 'Player1', value: 1 });
        expect(fleeAttempt1Value).toBe(1);
    });

    it('should update fleeAttempt2 when setFleeAttempt is called with username2', () => {
        service['username1'] = 'Player1';
        service['username2'] = 'Player2';

        let fleeAttempt2Value: number | undefined;
        service.fleeAttempt2$.subscribe((val) => (fleeAttempt2Value = val));

        service.setFleeAttempt({ username: 'Player2', value: 0 });
        expect(fleeAttempt2Value).toBe(0);
    });

    it('should call flee method without error', () => {
        // This is a simple call to ensure code coverage as the implementation is pending
        expect(() => service.flee('Player1')).not.toThrow();
    });

    it('should start fight when valid usernames and players are provided', () => {
        const mockPlayer1: Player = {
            id: '1',
            username: 'mockPlayer',
            avatar: '6',
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
            id: '1',
            username: 'mockPlayer0',
            avatar: '4',
            life: 100,
            attack: 10,
            defense: 10,
            rapidity: 2,
            attackDice: 'd6',
            defenseDice: 'd4',
            movementPts: 5,
            actions: 2,
        };

        playerServiceSpy.getPlayer.and.returnValues(mockPlayer1, mockPlayer2);

        let fightStartedValue: boolean | undefined;
        service.fightStarted$.subscribe((val) => (fightStartedValue = val));

        let turnValue: string | undefined;
        service.turn$.subscribe((val) => (turnValue = val));

        service.startFight('Player1', 'Player2');

        expect(service.getUsername1()).toBe('Player1');
        expect(service.getUsername2()).toBe('Player2');
        expect(fightStartedValue).toBe(true);
        expect(turnValue).toBe('mockPlayer');
        expect(playerServiceSpy.getPlayer).toHaveBeenCalledWith('Player1');
        expect(playerServiceSpy.getPlayer).toHaveBeenCalledWith('Player2');
    });

    it('should not start fight when usernames are provided but players do not exist', () => {
        playerServiceSpy.getPlayer.and.returnValues(undefined, undefined);

        let fightStartedValue: boolean | undefined;
        service.fightStarted$.subscribe((val) => (fightStartedValue = val));

        service.startFight('Player1', 'Player2');

        expect(fightStartedValue).toBe(false);
    });

    it('should not start fight when usernames are empty', () => {
        let fightStartedValue: boolean | undefined;
        service.fightStarted$.subscribe((val) => (fightStartedValue = val));

        service.startFight('', '');

        expect(fightStartedValue).toBe(false);
    });

    it('should end fight when usernames match', () => {
        service['username1'] = 'Player1';
        service['username2'] = 'Player2';

        service.endFight('Player1', 'Player2');

        expect(service.getUsername1()).toBe('');
        expect(service.getUsername2()).toBe('');
    });

    it('should not end fight when usernames do not match', () => {
        service['username1'] = 'Player1';
        service['username2'] = 'Player2';

        service.endFight('Player3', 'Player4');

        expect(service.getUsername1()).toBe('Player1');
        expect(service.getUsername2()).toBe('Player2');
    });

    it('should call attack method without error', () => {
        service['username1'] = 'Player1';
        service['username2'] = 'Player2';

        expect(() => service.attack('Player1')).not.toThrow();
        expect(() => service.attack('Player2')).not.toThrow();
    });
});
