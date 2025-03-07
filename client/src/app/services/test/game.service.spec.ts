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
            name: 'player1',
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
            name: 'player2',
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
        let playersWinsMap: Map<string, number> | undefined;
        let playersInGameMap: Map<string, boolean> | undefined;

        service.playersWinsMap$.subscribe((map) => (playersWinsMap = map));
        service.playersInGameMap$.subscribe((map) => (playersInGameMap = map));

        expect(playersWinsMap?.size).toBe(0);
        expect(playersInGameMap?.size).toBe(0);

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

        expect(showFightInterface).toBe(false);

        fightStartedSubject.next(true);
        expect(showFightInterface).toBe(true);

        fightStartedSubject.next(false);
        expect(showFightInterface).toBe(false);
    });

    it('should return win count for a player', () => {
        playersSubject.next(testPlayers);
        (service as any).playersWinsMap.next(
            new Map([
                ['player1', 2],
                ['player2', 1],
            ]),
        );

        expect(service.getWinCount('player1')).toBe(2);
        expect(service.getWinCount('player2')).toBe(1);
        expect(service.getWinCount('nonexistent')).toBeUndefined();
    });

    it('should increment win count for a player', () => {
        playersSubject.next(testPlayers);

        expect(service.getWinCount('player1')).toBe(0);

        service.incrementWinCount('player1');
        expect(service.getWinCount('player1')).toBe(1);

        service.incrementWinCount('player1');
        expect(service.getWinCount('player1')).toBe(2);

        service.incrementWinCount('nonexistent');
        expect(service.getWinCount('nonexistent')).toBeUndefined();
    });

    it('should handle the case where win count is undefined and default to 0', () => {
        playersSubject.next(testPlayers);

        const customMap = new Map<string, number>();
        customMap.set('player1', undefined as unknown as number);
        customMap.set('player2', 5);

        (service as any).playersWinsMap.next(customMap);
        service.incrementWinCount('player1');

        expect(service.getWinCount('player1')).toBe(1);
        expect(service.getWinCount('player2')).toBe(5);
    });

    it('should handle abandonGame correctly', () => {
        playersSubject.next(testPlayers);

        service.abandonGame('player1');
        service.abandonGame('nonexistent');

        expect().nothing();
    });

    it('should open dialog and abandon game when confirmed', async () => {
        playersSubject.next(testPlayers);

        const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        mockDialogRef.afterClosed.and.returnValue(of(true));
        dialogMock.open.and.returnValue(mockDialogRef as unknown as MatDialogRef<ConfirmationDialogComponent>);

        spyOn(service, 'abandonGame');

        const result = await service.confirmAndAbandonGame('player1');

        expect(dialogMock.open).toHaveBeenCalledWith(ConfirmationDialogComponent, {
            width: '350px',
            data: {
                title: 'Abandonner la partie',
                message: 'Êtes-vous sûr de vouloir abandonner cette partie player1?',
                confirmText: 'Abandonner',
                cancelText: 'Annuler',
            },
        });

        expect(service.abandonGame).toHaveBeenCalledWith('player1');

        expect(result).toBe(true);
    });

    it('should open dialog and not abandon game when cancelled', async () => {
        const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        mockDialogRef.afterClosed.and.returnValue(of(false));
        dialogMock.open.and.returnValue(mockDialogRef as unknown as MatDialogRef<ConfirmationDialogComponent>);

        spyOn(service, 'abandonGame');

        const result = await service.confirmAndAbandonGame('player1');

        expect(service.abandonGame).not.toHaveBeenCalled();

        expect(result).toBe(false);
    });
});
