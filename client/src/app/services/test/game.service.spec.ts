import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@app/components/common/confirmation-dialog/confirmation-dialog.component';

import { FightLogicService } from '@app/services/code/fight-logic.service';
import { GameService } from '@app/services/code/game.service';
import { SocketService } from '@app/services/code/socket.service';
import { Cell } from '@common/board';
import { Game } from '@common/game';
import { PlayerStats } from '@common/player';
import { BehaviorSubject, of } from 'rxjs';

describe('GameService', () => {
    let service: GameService;
    let fightLogicServiceMock: jasmine.SpyObj<FightLogicService>;
    let socketServiceMock: jasmine.SpyObj<SocketService>;
    let dialogMock: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        fightLogicServiceMock = jasmine.createSpyObj('FightLogicService', [], {
            fightStarted$: new BehaviorSubject<boolean>(false).asObservable(),
        });

        socketServiceMock = jasmine.createSpyObj('SocketService', ['getCurrentPlayerId']);

        dialogMock = jasmine.createSpyObj('MatDialog', ['open']);

        TestBed.configureTestingModule({
            providers: [
                GameService,
                { provide: FightLogicService, useValue: fightLogicServiceMock },
                { provide: SocketService, useValue: socketServiceMock },
                { provide: MatDialog, useValue: dialogMock },
            ],
        });

        service = TestBed.inject(GameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize showFightInterface$ with false', (done) => {
        service.showFightInterface$.subscribe((value: boolean) => {
            expect(value).toBeFalse();
            done();
        });
    });

    describe('Player Management', () => {
        let testPlayer: PlayerStats;

        beforeEach(() => {
            testPlayer = { id: '1', name: 'Player1' } as PlayerStats;
        });

        it('should return true if player is in game', () => {
            service.currentPlayers$.next([testPlayer]);
            expect(service.isPlayerInGame(testPlayer)).toBeTrue();
        });

        it('should return false if player is not in game', () => {
            service.currentPlayers$.next([]);
            expect(service.isPlayerInGame(testPlayer)).toBeFalse();
        });

        it('should remove player from game', () => {
            service.currentPlayers$.next([testPlayer]);
            service.removePlayerInGame(testPlayer);
            expect(service.currentPlayers$.value.length).toBe(0);
        });

        it('should not remove a player if they are not in the game', () => {
            const anotherPlayer = { id: '2', name: 'Player2' } as PlayerStats;
            service.currentPlayers$.next([anotherPlayer]);
            service.removePlayerInGame(testPlayer);
            expect(service.currentPlayers$.value.length).toBe(1);
        });
    });

    describe('Game State Updates', () => {
        let testGame: Game;
        let testPlayers: PlayerStats[];

        beforeEach(() => {
            testPlayers = [{ id: '1', name: 'Player1' } as PlayerStats, { id: '2', name: 'Player2' } as PlayerStats];
            testGame = {
                map: [[]] as Cell[][],
                players: testPlayers,
                currentTurn: 0,
            } as Game;
            socketServiceMock.getCurrentPlayerId.and.returnValue('1');
        });

        it('should set active player correctly', () => {
            service.currentPlayers$.next(testPlayers);
            service.setActivePlayer(1);
            expect(service.activePlayer$.value).toEqual(testPlayers[1]);
        });

        it('should correctly update game state when setGame() is called', () => {
            service.setGame(testGame);

            expect(service.map$.value).toBe(testGame.map);
            expect(service.currentPlayers$.value).toBe(testGame.players);
            expect(service.activePlayer$.value).toBe(testGame.players[0]);
            expect(service.clientPlayer$.value).toBe(testPlayers[0]);
        });
    });

    describe('Confirm and Abandon Game', () => {
        it('should resolve true when user confirms abandonment', async () => {
            const dialogRefMock = jasmine.createSpyObj<MatDialogRef<ConfirmationDialogComponent>>(['afterClosed']);
            dialogRefMock.afterClosed.and.returnValue(of(true));

            dialogMock.open.and.returnValue(dialogRefMock);

            const result = await service.confirmAndAbandonGame('TestGame');
            expect(result).toBeTrue();
        });

        it('should resolve false when user cancels abandonment', async () => {
            const dialogRefMock = jasmine.createSpyObj<MatDialogRef<ConfirmationDialogComponent>>(['afterClosed']);
            dialogRefMock.afterClosed.and.returnValue(of(false));

            dialogMock.open.and.returnValue(dialogRefMock);

            const result = await service.confirmAndAbandonGame('TestGame');
            expect(result).toBeFalse();
        });
    });
});
