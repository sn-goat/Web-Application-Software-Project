/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { PlayerToolsService } from '@app/services/code/player-tools.service';
import { PlayerService } from '@app/services/code/player.service';
import { Item } from '@common/enums';
import { Player } from '@common/player';
import { BehaviorSubject } from 'rxjs';

describe('PlayerToolsService', () => {
    let service: PlayerToolsService;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let playersSubject: BehaviorSubject<Player[]>;

    const mockPlayer: Player = {
        id: '1',
        username: 'testPlayer',
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

    beforeEach(() => {
        playersSubject = new BehaviorSubject<Player[]>([]);

        const spy = jasmine.createSpyObj('PlayerService', ['getPlayer', 'getPlayerUsername'], {
            players$: playersSubject.asObservable(),
        });

        spy.getPlayerUsername.and.returnValue('testPlayer');
        spy.getPlayer.and.returnValue(undefined);

        TestBed.configureTestingModule({
            providers: [PlayerToolsService, { provide: PlayerService, useValue: spy }],
        });

        service = TestBed.inject(PlayerToolsService);
        playerServiceSpy = TestBed.inject(PlayerService) as jasmine.SpyObj<PlayerService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with default values', () => {
        let items: Item[] | undefined;
        let timer: string | undefined;

        service.items$.subscribe((value) => (items = value));
        service.timer$.subscribe((value) => (timer = value));

        expect(items).toEqual([]);
        expect(timer).toEqual('00:00');
        expect((service as any).player).toEqual({});
    });

    it('should update player when players$ emits and getPlayer returns a value', () => {
        playerServiceSpy.getPlayer.and.returnValue(mockPlayer);

        playersSubject.next([mockPlayer]);

        expect((service as any).player).toEqual(mockPlayer);
    });

    it('should not update player if getPlayer returns undefined', () => {
        playerServiceSpy.getPlayer.and.returnValue(undefined);

        (service as any).player = {};

        playersSubject.next([]);

        expect((service as any).player).toEqual({});
    });

    it('should set timer correctly', () => {
        let timer: string | undefined;
        service.timer$.subscribe((value) => (timer = value));

        expect(timer).toBe('00:00');

        service.setTimer('01:30');

        expect(timer).toBe('01:30');
    });

    it('should add item when items array has less than 2 items', () => {
        let items: Item[] | undefined;
        service.items$.subscribe((value) => (items = value));

        expect(items).toEqual([]);

        service.addItem(Item.SWORD);

        expect(items).toEqual([Item.SWORD]);

        service.addItem(Item.BOW);

        expect(items).toEqual([Item.SWORD, Item.BOW]);
    });

    it('should replace last item when items array already has 2 items', () => {
        (service as any).items.next([Item.SWORD, Item.BOW]);

        let items: Item[] | undefined;
        service.items$.subscribe((value) => (items = value));

        expect(items).toEqual([Item.SWORD, Item.BOW]);

        service.addItem(Item.CHEST);

        expect(items).toEqual([Item.SWORD, Item.CHEST]);
    });

    it('should not add DEFAULT items', () => {
        (service as any).items.next([Item.SWORD]);

        let items: Item[] | undefined;
        service.items$.subscribe((value) => (items = value));

        service.addItem(Item.DEFAULT);

        expect(items).toEqual([Item.SWORD]);
    });

    it('should remove item when it exists', () => {
        (service as any).items.next([Item.SWORD, Item.BOW]);

        let items: Item[] | undefined;
        service.items$.subscribe((value) => (items = value));

        expect(items).toEqual([Item.SWORD, Item.BOW]);

        service.removeItem(Item.SWORD);

        expect(items).toEqual([Item.BOW]);
    });

    it('should not remove item when it does not exist', () => {
        (service as any).items.next([Item.SWORD]);

        let items: Item[] | undefined;
        service.items$.subscribe((value) => (items = value));

        expect(items).toEqual([Item.SWORD]);

        service.removeItem(Item.BOW);

        expect(items).toEqual([Item.SWORD]);
    });

    it('should call endTurn without errors', () => {
        (service as any).player = mockPlayer;

        expect(() => service.endTurn()).not.toThrow();
    });

    it('should call performAction without errors', () => {
        (service as any).player = mockPlayer;

        expect(() => service.performAction()).not.toThrow();
    });

    it('should handle endTurn with empty player', () => {
        (service as any).player = {} as Player;

        expect(() => service.endTurn()).not.toThrow();
    });

    it('should handle performAction with empty player', () => {
        (service as any).player = {} as Player;

        expect(() => service.performAction()).not.toThrow();
    });
});
