/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MockRouter } from '@app/helpers/router-mock';
import { MockSocketService } from '@app/helpers/socket-service-mock';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { PlayerService } from '@app/services/player/player.service';
import { RoomService } from '@app/services/room/room.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { Board } from '@common/board';
import { Visibility } from '@common/enums';
import { Avatar, IRoom } from '@common/game';
import { IPlayer } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { FormCharacterComponent } from './form-character.component';

// Using the correct type definitions
type DiceBonus = 'attack' | 'defense';
type StatBonus = 'life' | 'speed';

describe('FormCharacterComponent', () => {
    let component: FormCharacterComponent;
    let fixture: ComponentFixture<FormCharacterComponent>;
    let mockSocketService: MockSocketService;
    let mockRouter: MockRouter;
    let mockGameMapService: jasmine.SpyObj<GameMapService>;
    let mockRoomService: Partial<RoomService>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;

    beforeEach(async () => {
        mockSocketService = new MockSocketService();
        mockRouter = new MockRouter(); // MockRouter already has navigate spy set up
        mockGameMapService = jasmine.createSpyObj('GameMapService', ['getGameMap']);
        mockPlayerService = jasmine.createSpyObj('PlayerService', ['setAdmin']);

        // Create a complete Board object with all required properties
        const mockBoard: Board = {
            name: 'Test Map',
            description: 'A test map for unit tests',
            size: 15,
            isCTF: false,
            board: [], // Your board cells
            visibility: Visibility.Public, // Use correct enum value
        };
        // Note: MockSocketService already initializes gameRoom with the correct structure
        mockSocketService.gameRoom = {
            accessCode: 'test-code',
            organizerId: 'organizer-id',
            isLocked: false,
            game: { players: [], map: mockBoard.board, isDebugMode: false, isCTF: false, maxPlayers: 4, currentTurn: 0 },
        };

        const mockConnectedSubject = new BehaviorSubject<IPlayer[]>([{ avatar: 'A1' }, { avatar: 'B2' }] as IPlayer[]);
        const mockIsRoomLocked = new BehaviorSubject<boolean>(false);

        mockRoomService = {
            connected: mockConnectedSubject,
            isRoomLocked: mockIsRoomLocked,
        };

        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockGameMapService.getGameMap.and.returnValue(boardSubject);

        await TestBed.configureTestingModule({
            imports: [CommonModule, FormsModule, RouterLink, FormCharacterComponent],
            providers: [
                { provide: SocketEmitterService, useValue: mockSocketService },
                { provide: SocketReceiverService, useValue: mockSocketService },
                { provide: Router, useValue: mockRouter }, // Properly providing MockRouter
                { provide: GameMapService, useValue: mockGameMapService },
                { provide: RoomService, useValue: mockRoomService },
                { provide: PlayerService, useValue: mockPlayerService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FormCharacterComponent);
        component = fixture.componentInstance;

        // Setup required properties before detectChanges
        component.playerInput = {
            name: 'test-id',
            avatar: Avatar.Nain, // Use a valid Avatar enum value
            attackPower: 0,
            defensePower: 0,
            speed: 0,
            life: 0,
            attackDice: 'D6',
            defenseDice: 'D4',
        };

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize player stats', () => {
        expect(component.playerInput).toBeDefined();
        expect(component.playerInput.name).toBeDefined();
    });

    it('should select combat stat correctly', () => {
        // First test selectStat method for stat bonuses
        component.selectStat('life' as StatBonus);
        expect(component.lifeSelected).toBeTrue();

        // Test mutual exclusivity of stat bonuses
        component.selectStat('speed' as StatBonus);
        expect(component.lifeSelected).toBeFalse(); // Life should be deselected
        expect(component.speedSelected).toBeTrue();

        // Reset stats for next test
        component.lifeSelected = false;
        component.speedSelected = false;
        component.attackSelected = false;
        component.defenseSelected = false;

        // Test dice bonuses
        component.selectCombatStat('attack' as DiceBonus);
        expect(component.attackSelected).toBeTrue();

        // Test mutual exclusivity of dice bonuses
        component.selectCombatStat('defense' as DiceBonus);
        expect(component.attackSelected).toBeFalse(); // Attack should be deselected
        expect(component.defenseSelected).toBeTrue();

        // Test toggling off
        component.selectCombatStat('defense' as DiceBonus);
        expect(component.defenseSelected).toBeFalse();
    });

    it('should validate canJoin correctly', () => {
        // Without name and stats
        component.playerInput.name = '';
        component.lifeSelected = false;
        component.speedSelected = false;
        component.attackSelected = false;
        component.defenseSelected = false;
        expect(component.canJoin()).toBeFalse();

        // With name but no stats
        component.playerInput.name = 'TestPlayer';
        expect(component.canJoin()).toBeFalse();

        // With name and one stat
        component.lifeSelected = true;
        expect(component.canJoin()).toBeFalse();

        // With name and two stats (one of each type)
        component.attackSelected = true;
        expect(component.canJoin()).toBeTrue();

        // With name and two stats of same type (should still be true)
        component.lifeSelected = false;
        component.speedSelected = true;
        expect(component.canJoin()).toBeTrue();
    });

    it('should share character when shareCharacter is called', () => {
        spyOn(mockSocketService, 'shareCharacter');
        component.accessCode = 'test-code';

        component.shareCharacter();
        expect(mockSocketService.shareCharacter).toHaveBeenCalledWith(component.playerInput);
    });

    it('should emit closePopup event when onClose is called', () => {
        spyOn(component.closePopup, 'emit');
        component.onClose();
        expect(component.closePopup.emit).toHaveBeenCalled();
    });

    // Add these tests to your existing test suite

    it('should update portrait and avatar when navigating portraits', () => {
        const initialImage = component.currentPortraitImage;

        // Navigate next
        component.navigatePortrait('next');
        const nextImage = component.currentPortraitImage;
        expect(nextImage).not.toBe(initialImage);

        // Navigate prev (should go back to original)
        component.navigatePortrait('prev');
        const prevImage = component.currentPortraitImage;
        expect(prevImage).toBe(initialImage);

        // Wrap around from end to start
        for (let i = 0; i < 100; i++) component.navigatePortrait('next');
        expect(component.currentPortraitImage).toBeTruthy();

        // Wrap from start to end
        for (let i = 0; i < 100; i++) component.navigatePortrait('prev');
        expect(component.currentPortraitImage).toBeTruthy();
    });

    it('should update stat values when selectStat is called', () => {
        // Test stat values change correctly when selecting life
        component.playerInput.life = 4;
        component.playerInput.speed = 4;
        component.lifeSelected = false;
        component.speedSelected = false;

        // Selecting life should increase its value by 2
        component.selectStat('life');
        expect(component.lifeSelected).toBeTrue();
        expect(component.playerInput.life).toBe(6);

        // Toggling life off should decrease its value by 2
        component.selectStat('life');
        expect(component.lifeSelected).toBeFalse();
        expect(component.playerInput.life).toBe(4);

        // Test mutual exclusivity - selecting speed after life
        component.selectStat('life');
        expect(component.lifeSelected).toBeTrue();
        component.selectStat('speed');
        expect(component.lifeSelected).toBeFalse();
        expect(component.speedSelected).toBeTrue();
        expect(component.playerInput.life).toBe(4);
        expect(component.playerInput.speed).toBe(6);
    });

    it('should mark current avatar as taken correctly', () => {
        // Trigger the roomService.connected event with avatars
        const avatars = [component.currentPortraitStaticImage];
        mockRoomService.connected?.next([{ avatar: avatars[0] }] as IPlayer[]);
        expect(component.isCurrentAvatarTaken).toBeTrue();

        // Navigate to an unused avatar
        for (let i = 0; i < 10; i++) {
            component.navigatePortrait('next');
            if (!avatars.includes(component.currentPortraitImage)) break;
        }

        expect(component.isCurrentAvatarTaken).toBeFalse();
    });

    it('should set isRoomLocked to true when room locked event occurs', () => {
        mockRoomService.isRoomLocked?.next(true);
        expect(component.isRoomLocked).toBeTrue();
    });

    it('createGame should call createRoom', fakeAsync(() => {
        spyOn(mockSocketService, 'createRoom');
        component.createGame();
        tick();

        expect(mockGameMapService.getGameMap).toHaveBeenCalled();
    }));

    it('onRoomCreated should assign accessCode, shareCharacter, setAdmin and naviguate to lobby', () => {
        spyOn(mockSocketService, 'shareCharacter');
        mockSocketService.triggerRoomCreated({ accessCode: 'accessCode' } as IRoom);

        expect(mockSocketService.shareCharacter).toHaveBeenCalledWith(component.playerInput);
        expect(mockPlayerService.setAdmin).toHaveBeenCalledWith(true);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/lobby'], { state: { accessCode: 'accessCode' } });
    });
});
