/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TestBed } from '@angular/core/testing';
import { MockSocketService } from '@app/helpers/socket-service-mock';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { IFight } from '@common/game';
import { FightInfo, IPlayer } from '@common/player';
import { BehaviorSubject } from 'rxjs';

const testPlayer1 = {
    id: 'player1',
    name: 'Player One',
    avatar: 'HeroIcon',
    attackPower: 4,
    defensePower: 4,
    speed: 6,
    life: 4,
    attackDice: 'D4',
    defenseDice: 'D6',
    actions: 1,
    wins: 0,
    movementPts: 6,
    position: { x: 0, y: 0 },
    spawnPosition: { x: 0, y: 0 },
} as IPlayer;

const testPlayer2 = {
    id: 'test2',
    name: 'Player2',
    avatar: 'VillainIcon',
    attackPower: 4,
    defensePower: 4,
    speed: 6,
    life: 4,
    attackDice: 'D4',
    defenseDice: 'D6',
    actions: 1,
    wins: 0,
    movementPts: 6,
    position: { x: 1, y: 1 },
    spawnPosition: { x: 1, y: 1 },
} as IPlayer;

const fightInfo = {
    fleeAttempts: 2,
    currentLife: 4,
    diceResult: 3,
} as FightInfo;

function createTestFight(): IFight {
    return {
        player1: { ...testPlayer1, ...fightInfo },
        player2: { ...testPlayer2, ...fightInfo },
        currentPlayer: { ...testPlayer1, ...fightInfo },
    };
}

describe('FightLogicService', () => {
    let service: FightLogicService;

    const socketServiceMock = new MockSocketService();

    const gameServiceMock = {
        getAccessCode: jasmine.createSpy('getAccessCode').and.returnValue('ACCESS_CODE'),
        isActionSelected: new BehaviorSubject<boolean>(false),
    };

    const playerServiceMock = {
        getPlayer: jasmine.createSpy('getPlayer').and.returnValue({ ...testPlayer1 } as IPlayer),
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                FightLogicService,
                { provide: SocketEmitterService, useValue: socketServiceMock },
                { provide: SocketReceiverService, useValue: socketServiceMock },
                { provide: GameService, useValue: gameServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
            ],
        });
        service = TestBed.inject(FightLogicService);
    });

    it('should update fight and fightStarted when onFightInit is emitted', () => {
        const testFight = createTestFight();
        socketServiceMock.triggerOnFightInit(testFight);
        expect(service.fight.value).toEqual(testFight);
        expect(service.fightStarted.value).toBeTrue();
    });

    it('should update fight when onSwitchTurn is emitted', () => {
        const switchedFight = createTestFight();
        socketServiceMock.triggerOnFightTurnChanged(switchedFight);
        expect(service.fight.value).toEqual(switchedFight);
    });

    it('should call endFight when onEndFight is emitted', () => {
        socketServiceMock.triggerEndFight(null);
        expect(service.fight.value).toEqual({} as IFight);
        expect(service.fightStarted.value).toBeFalse();
    });

    it('should return the opponent based on current player', () => {
        const testFight = createTestFight();
        socketServiceMock.triggerOnFightInit(testFight);
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
        spyOn(socketServiceMock, 'flee');
        service.flee();
        expect(socketServiceMock.flee).toHaveBeenCalledWith();
    });

    it('should call playerAttack on the socketService when attack is called', () => {
        spyOn(socketServiceMock, 'attack');
        service.attack();
        expect(socketServiceMock.attack).toHaveBeenCalledWith();
    });
});
