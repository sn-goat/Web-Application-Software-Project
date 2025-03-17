/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TestBed } from '@angular/core/testing';
import { FightLogicService } from '@app/services/code/fight-logic.service';
import { GameService } from '@app/services/code/game.service';
import { PlayerService } from '@app/services/code/player.service';
import { SocketService } from '@app/services/code/socket.service';
import { Fight } from '@common/game';
import { PlayerStats } from '@common/player';
import { Subject } from 'rxjs';

// Définition unique des joueurs de test
const testPlayer1 = {
    id: 'player1',
    name: 'Player One',
    avatar: 'HeroIcon',
    attack: 4,
    defense: 4,
    speed: 6,
    life: 4,
    attackDice: 'D4',
    defenseDice: 'D6',
    actions: 1,
    wins: 0,
    movementPts: 6,
    position: { x: 0, y: 0 },
    spawnPosition: { x: 0, y: 0 },
} as PlayerStats;

const testPlayer2 = {
    id: 'test2',
    name: 'Player2',
    avatar: 'VillainIcon',
    attack: 4,
    defense: 4,
    speed: 6,
    life: 4,
    attackDice: 'D4',
    defenseDice: 'D6',
    actions: 1,
    wins: 0,
    movementPts: 6,
    position: { x: 1, y: 1 },
    spawnPosition: { x: 1, y: 1 },
} as PlayerStats;

// Fonction utilitaire pour créer un combat de test
function createTestFight(): Fight {
    return {
        player1: { ...testPlayer1 },
        player2: { ...testPlayer2 },
        currentPlayer: { ...testPlayer1 },
    };
}

describe('FightLogicService', () => {
    let service: FightLogicService;

    // Sujets pour simuler les événements du SocketService
    const fightInitSubject = new Subject<Fight>();
    const switchTurnSubject = new Subject<Fight>();
    const endFightSubject = new Subject<void>();
    const winnerSubject = new Subject<any>();
    const loserSubject = new Subject<any>();

    // Mocks des services dépendants
    const socketServiceMock = {
        onFightInit: jasmine.createSpy('onFightInit').and.returnValue(fightInitSubject.asObservable()),
        onSwitchTurn: jasmine.createSpy('onSwitchTurn').and.returnValue(switchTurnSubject.asObservable()),
        onEndFight: jasmine.createSpy('onEndFight').and.returnValue(endFightSubject.asObservable()),
        onWinner: jasmine.createSpy('onWinner').and.returnValue(winnerSubject.asObservable()),
        onLoser: jasmine.createSpy('onLoser').and.returnValue(loserSubject.asObservable()),
        playerFlee: jasmine.createSpy('playerFlee'),
        playerAttack: jasmine.createSpy('playerAttack'),
    };

    const gameServiceMock = {
        getAccessCode: jasmine.createSpy('getAccessCode').and.returnValue('ACCESS_CODE'),
    };

    const playerServiceMock = {
        getPlayer: jasmine.createSpy('getPlayer').and.returnValue({ ...testPlayer1 } as PlayerStats),
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                FightLogicService,
                { provide: SocketService, useValue: socketServiceMock },
                { provide: GameService, useValue: gameServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
            ],
        });
        service = TestBed.inject(FightLogicService);
    });

    it('should update fight and fightStarted when onFightInit is emitted', () => {
        const testFight = createTestFight();
        fightInitSubject.next(testFight);
        expect(service.fight.value).toEqual(testFight);
        expect(service.fightStarted.value).toBeTrue();
    });

    it('should update fight when onSwitchTurn is emitted', () => {
        const switchedFight = createTestFight();
        switchTurnSubject.next(switchedFight);
        expect(service.fight.value).toEqual(switchedFight);
    });

    it('should call endFight when onEndFight is emitted', () => {
        const testFight = createTestFight();
        fightInitSubject.next(testFight);
        endFightSubject.next();
        expect(service.fight.value).toEqual({} as Fight);
        expect(service.fightStarted.value).toBeFalse();
    });

    it('should return the opponent based on current player', () => {
        const testFight = createTestFight();
        fightInitSubject.next(testFight);
        const opponent = service.getOpponent();
        expect(opponent).toEqual(testFight.player2);
    });

    it('should return true for attack provocation if cell.player is defined and not Avatar.Default', () => {
        const cell = { player: 'SomePlayer' } as any;
        expect(service.isAttackProvocation(cell)).toBeTrue();
    });

    it('should return false for attack provocation if cell.player is undefined', () => {
        const cell = {} as any;
        expect(service.isAttackProvocation(cell)).toBeFalse();
    });

    it('should call playerFlee on the socketService when flee is called', () => {
        service.flee();
        expect(socketServiceMock.playerFlee).toHaveBeenCalledWith('ACCESS_CODE');
    });

    it('should call playerAttack on the socketService when attack is called', () => {
        service.attack();
        expect(socketServiceMock.playerAttack).toHaveBeenCalledWith('ACCESS_CODE');
    });
});
