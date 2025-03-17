/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TestBed } from '@angular/core/testing';
import { MockSocketService } from '@app/helpers/mockSocketService';
import { PlayerService } from '@app/services/code/player.service';
import { SocketService } from '@app/services/code/socket.service';
import { Vec2 } from '@common/board';
import { PathInfo } from '@common/game';
import { PlayerStats } from '@common/player';

describe('PlayerService', () => {
    let service: PlayerService;
    let socketService: MockSocketService;
    let dummyPlayer: PlayerStats;
    let dummyOtherPlayer: PlayerStats;
    let dummyPath: Map<string, PathInfo>;
    let dummyPathInfo: PathInfo;
    let spawnPosition: Vec2;

    beforeEach(() => {
        socketService = new MockSocketService();

        TestBed.configureTestingModule({
            providers: [PlayerService, { provide: SocketService, useValue: socketService }],
        });
        service = TestBed.inject(PlayerService);

        dummyPlayer = {
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
        dummyOtherPlayer = {
            id: 'player2',
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
        dummyPathInfo = {
            /* minimal properties based on PathInfo structure */
        } as PathInfo;
        dummyPath = new Map<string, PathInfo>();
        dummyPath.set('1,1', dummyPathInfo);
        spawnPosition = { x: 5, y: 5 };

        // Ensure service has a player for testing turn events.
        service.setPlayer(dummyPlayer);
    });

    it('should set player active and assign path on turn switch when current player is active', () => {
        socketService.triggerSwitchTurn({ player: dummyPlayer, path: dummyPath });
        expect(service.isActive()).toBe(true);
        expect(service.path.value).toEqual(dummyPath);
    });

    it('should set player inactive and clear path on turn switch when another player is active', () => {
        socketService.triggerSwitchTurn({ player: dummyOtherPlayer, path: dummyPath });
        expect(service.isActive()).toBe(false);
        expect(service.path.value.size).toBe(0);
    });

    it('should update player and path on turn update', () => {
        const updatedPlayer: PlayerStats = { ...service.getPlayer(), spawnPosition: { x: 2, y: 2 }, position: { x: 2, y: 2 } };
        const newPath = new Map<string, PathInfo>();
        newPath.set('2,2', dummyPathInfo);
        socketService.triggerTurnUpdate({ player: updatedPlayer, path: newPath });
        expect(service.getPlayer()).toEqual(updatedPlayer);
        expect(service.path.value).toEqual(newPath);
        expect(service.isActive()).toBe(true);
    });

    it('should update spawn position on assign spawn', () => {
        // Before spawn assignment, player's spawn and position should be as initially set.
        expect(service.getPlayer().spawnPosition).toEqual({ x: 0, y: 0 });
        expect(service.getPlayer().position).toEqual({ x: 0, y: 0 });
        socketService.triggerAssignSpawn(spawnPosition);
        // After assignment they should update.
        expect(service.getPlayer().spawnPosition).toEqual(spawnPosition);
        expect(service.getPlayer().position).toEqual(spawnPosition);
    });

    it('should send move if path exists for given position', () => {
        // Setup path so that the key for position {x:1, y:1} exists.
        const movePath = new Map<string, PathInfo>();
        movePath.set('1,1', dummyPathInfo);
        service.setPath(movePath);
        service.setAccessCode('ACCESS123');

        // Création de l'espion sur movePlayer
        spyOn(socketService, 'movePlayer');

        // Call sendMove with the position corresponding to key "1,1".
        service.sendMove({ x: 1, y: 1 });
        expect(service.isActive()).toBe(false);
        expect(socketService.movePlayer).toHaveBeenCalledWith('ACCESS123', jasmine.any(Object), jasmine.objectContaining({ id: dummyPlayer.id }));
    });

    it('should not send move if no path exists for given position', () => {
        // Clear any existing path
        service.setPath(new Map());
        service.setAccessCode('ACCESS123');

        // Création de l'espion sur movePlayer
        spyOn(socketService, 'movePlayer');

        service.sendMove({ x: 5, y: 5 });
        expect(socketService.movePlayer).not.toHaveBeenCalled();
    });

    it('should correctly get and set admin status', () => {
        service.setAdmin(true);
        expect(service.isPlayerAdmin()).toBe(true);
        service.setAdmin(false);
        expect(service.isPlayerAdmin()).toBe(false);
    });

    it('should correctly set and get access code', () => {
        service.setAccessCode('MYCODE');
        expect(service.getAccessCode()).toBe('MYCODE');
    });
});
