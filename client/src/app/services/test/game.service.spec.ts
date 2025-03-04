/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@app/components/common/confirmation-dialog/confirmation-dialog.component';
import { FightLogicService } from '@app/services/code/fight-logic.service';
import { GameService } from '@app/services/code/game.service';
import { PlayerService } from '@app/services/code/player.service';
import { Player } from '@common/player';
import { BehaviorSubject, of } from 'rxjs';

describe('GameService', () => {
    let service: GameService;
    let dialogMock: jasmine.SpyObj<MatDialog>;

    let playersSubject: BehaviorSubject<Player[]>;
    let fightStartedSubject: BehaviorSubject<boolean>;

    const testPlayers: Player[] = [
        {
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
        },
        {
            id: '2',
            username: 'player2',
            avatar: '2',
            life: 100,
            attack: 10,
            defense: 10,
            rapidity: 5,
            attackDice: 'd6',
            defenseDice: 'd4',
            movementPts: 5,
            actions: 2,
        },
    ];

    beforeEach(() => {
        playersSubject = new BehaviorSubject<Player[]>([]);
        fightStartedSubject = new BehaviorSubject<boolean>(false);

        const playerSpy = jasmine.createSpyObj('PlayerService', ['getPlayer'], {
            players$: playersSubject.asObservable(),
        });

        const fightLogicSpy = jasmine.createSpyObj('FightLogicService', [], {
            fightStarted$: fightStartedSubject.asObservable(),
        });

        const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

        TestBed.configureTestingModule({
            providers: [
                GameService,
                { provide: PlayerService, useValue: playerSpy },
                { provide: FightLogicService, useValue: fightLogicSpy },
                { provide: MatDialog, useValue: dialogSpy },
            ],
        });

        service = TestBed.inject(GameService);
        service = TestBed.inject(GameService);
        service = TestBed.inject(GameService);
        dialogMock = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    });
    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with empty maps', () => {
        let playersWinsMap: Map<string, number> | undefined;
        let playersInGameMap: Map<string, boolean> | undefined;

        service.playersWinsMap$.subscribe((map) => (playersWinsMap = map));
        service.playersInGameMap$.subscribe((map) => (playersInGameMap = map));

        expect(playersWinsMap).toBeDefined();
        expect(playersWinsMap?.size).toBe(0);
        expect(playersInGameMap).toBeDefined();
        expect(playersInGameMap?.size).toBe(0);
    });

    it('should update maps when players$ emits', () => {
        // Initial state should be empty maps
        let playersWinsMap: Map<string, number> | undefined;
        let playersInGameMap: Map<string, boolean> | undefined;

        service.playersWinsMap$.subscribe((map) => (playersWinsMap = map));
        service.playersInGameMap$.subscribe((map) => (playersInGameMap = map));

        expect(playersWinsMap?.size).toBe(0);
        expect(playersInGameMap?.size).toBe(0);

        // Emit players and check maps are updated
        playersSubject.next(testPlayers);

        expect(playersWinsMap?.size).toBe(2);
        expect(playersWinsMap?.get('player1')).toBe(0);
        expect(playersWinsMap?.get('player2')).toBe(0);

        expect(playersInGameMap?.size).toBe(2);
        expect(playersInGameMap?.get('player1')).toBe(true);
        expect(playersInGameMap?.get('player2')).toBe(true);
    });

    it('should update showFightInterface$ when fightStarted$ emits', () => {
        let showFightInterface: boolean | undefined;
        service.showFightInterface$.subscribe((value) => (showFightInterface = value));

        // Initial value should be false
        expect(showFightInterface).toBe(false);

        // When fightStarted$ emits true, showFightInterface$ should emit true
        fightStartedSubject.next(true);
        expect(showFightInterface).toBe(true);

        // When fightStarted$ emits false, showFightInterface$ should emit false
        fightStartedSubject.next(false);
        expect(showFightInterface).toBe(false);
    });

    it('should return win count for a player', () => {
        // Setup test data
        playersSubject.next(testPlayers);
        (service as any).playersWinsMap.next(
            new Map([
                ['player1', 2],
                ['player2', 1],
            ]),
        );

        // Test getWinCount
        expect(service.getWinCount('player1')).toBe(2);
        expect(service.getWinCount('player2')).toBe(1);
        expect(service.getWinCount('nonexistent')).toBeUndefined();
    });

    it('should increment win count for a player', () => {
        // Setup test data
        playersSubject.next(testPlayers);

        // Initial win count should be 0
        expect(service.getWinCount('player1')).toBe(0);

        // Increment and check
        service.incrementWinCount('player1');
        expect(service.getWinCount('player1')).toBe(1);

        // Increment again and check
        service.incrementWinCount('player1');
        expect(service.getWinCount('player1')).toBe(2);

        // Don't increment nonexistent player
        service.incrementWinCount('nonexistent');
        expect(service.getWinCount('nonexistent')).toBeUndefined();
    });

    it('should handle the case where win count is undefined and default to 0', () => {
        // Setup test data with players
        playersSubject.next(testPlayers);

        // Create a map where one player has a valid count and one has undefined
        const customMap = new Map<string, number>();
        customMap.set('player1', undefined as unknown as number); // Force undefined value
        customMap.set('player2', 5);

        // Set the map directly to test the undefined scenario
        (service as any).playersWinsMap.next(customMap);

        // When we increment, it should treat undefined as 0
        service.incrementWinCount('player1');

        expect(service.getWinCount('player1')).toBe(1); // undefined + 1 = 1
        expect(service.getWinCount('player2')).toBe(5); // unchanged
    });

    it('should handle abandonGame correctly', () => {
        // Setup test data
        playersSubject.next(testPlayers);

        // Call abandonGame - though we're only testing the branch coverage since
        // the actual behavior is noted as "to be implemented with socket"
        service.abandonGame('player1');
        service.abandonGame('nonexistent');

        // Since the implementation is pending, we're just ensuring the method doesn't throw
        expect().nothing();
    });

    it('should open dialog and abandon game when confirmed', async () => {
        // Setup test data
        playersSubject.next(testPlayers);

        // Setup dialog mock
        const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        mockDialogRef.afterClosed.and.returnValue(of(true)); // User clicked confirm
        dialogMock.open.and.returnValue(mockDialogRef as unknown as MatDialogRef<ConfirmationDialogComponent>);

        // Spy on abandonGame
        spyOn(service, 'abandonGame');

        // Call confirmAndAbandonGame
        const result = await service.confirmAndAbandonGame('player1');

        // Check dialog was opened with correct params
        expect(dialogMock.open).toHaveBeenCalledWith(ConfirmationDialogComponent, {
            width: '350px',
            data: {
                title: 'Abandonner la partie',
                message: 'Êtes-vous sûr de vouloir abandonner cette partie player1?',
                confirmText: 'Abandonner',
                cancelText: 'Annuler',
            },
        });

        // Check abandonGame was called
        expect(service.abandonGame).toHaveBeenCalledWith('player1');

        // Check result
        expect(result).toBe(true);
    });

    it('should open dialog and not abandon game when cancelled', async () => {
        // Setup dialog mock to return false (user cancelled)
        const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        mockDialogRef.afterClosed.and.returnValue(of(false));
        dialogMock.open.and.returnValue(mockDialogRef as unknown as MatDialogRef<ConfirmationDialogComponent>);

        // Spy on abandonGame
        spyOn(service, 'abandonGame');

        // Call confirmAndAbandonGame
        const result = await service.confirmAndAbandonGame('player1');

        // Check abandonGame was not called
        expect(service.abandonGame).not.toHaveBeenCalled();

        // Check result
        expect(result).toBe(false);
    });
});
