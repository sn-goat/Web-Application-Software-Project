/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MockRouter } from '@app/helpers/mockRouter';
import { MockSocketService } from '@app/helpers/mockSocketService';
import { GameMapService } from '@app/services/code/game-map.service';
import { SocketService } from '@app/services/code/socket.service';
import { Board } from '@common/board';
import { Visibility } from '@common/enums';
import { ASSET_EXT, ASSET_PATH, Avatar } from '@common/game';
import { PlayerStats } from '@common/player';
import { BehaviorSubject, of } from 'rxjs';
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

    beforeEach(async () => {
        mockSocketService = new MockSocketService();
        mockRouter = new MockRouter(); // MockRouter already has navigate spy set up
        mockGameMapService = jasmine.createSpyObj('GameMapService', ['getGameMap']);

        // Note: MockSocketService already initializes gameRoom with the correct structure
        mockSocketService.gameRoom = {
            accessCode: 'test-code',
            organizerId: 'organizer-id',
            players: [], // Empty array for players
            isLocked: false,
            mapSize: 15, // Use mapSize to match your MockSocketService
        };

        // Create a complete Board object with all required properties
        const mockBoard: Board = {
            name: 'Test Map',
            description: 'A test map for unit tests',
            size: 15,
            isCTF: false,
            board: [], // Your board cells
            visibility: Visibility.PUBLIC, // Use correct enum value
        };

        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockGameMapService.getGameMap.and.returnValue(boardSubject);

        // Important: Trigger players list with an empty array BEFORE component creation
        mockSocketService.triggerPlayersList([]);

        await TestBed.configureTestingModule({
            imports: [CommonModule, FormsModule, RouterLink, FormCharacterComponent],
            providers: [
                { provide: SocketService, useValue: mockSocketService },
                { provide: Router, useValue: mockRouter }, // Properly providing MockRouter
                { provide: GameMapService, useValue: mockGameMapService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FormCharacterComponent);
        component = fixture.componentInstance;

        // Setup required properties before detectChanges
        component.playerStats = {
            id: 'test-id',
            name: '',
            avatar: Avatar.Dwarf, // Use a valid Avatar enum value
            attack: 0,
            defense: 0,
            speed: 0,
            life: 0,
            attackDice: 'D6',
            defenseDice: 'D4',
            actions: 0,
            wins: 0,
            movementPts: 0,
            position: { x: 0, y: 0 },
            spawnPosition: { x: 0, y: 0 },
        };

        // Trigger players list again after component setup
        mockSocketService.triggerPlayersList([]);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize player stats', () => {
        expect(component.playerStats).toBeDefined();
        expect(component.playerStats.id).toBeDefined();
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
        component.playerStats.name = '';
        component.lifeSelected = false;
        component.speedSelected = false;
        component.attackSelected = false;
        component.defenseSelected = false;
        expect(component.canJoin()).toBeFalse();

        // With name but no stats
        component.playerStats.name = 'TestPlayer';
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
        expect(mockSocketService.shareCharacter).toHaveBeenCalledWith('test-code', component.playerStats);
    });

    it('should emit closePopup event when onClose is called', () => {
        spyOn(component.closePopup, 'emit');
        component.onClose();
        expect(component.closePopup.emit).toHaveBeenCalled();
    });

    // Add these tests to your existing test suite

    it('should update portrait and avatar when navigating portraits', () => {
        // Save initial values
        const initialIndex = component.currentPortraitIndex;
        const initialAvatar = component.playerStats.avatar;

        // Test navigation forward
        component.navigatePortrait('next');
        const expectedNextIndex = (initialIndex + 1) % component.totalPortraits;
        expect(component.currentPortraitIndex).toBe(expectedNextIndex);
        expect(component.playerStats.avatar).toBe(ASSET_PATH + (expectedNextIndex + 1) + ASSET_EXT);

        // Test navigation backward
        component.navigatePortrait('prev');
        expect(component.currentPortraitIndex).toBe(initialIndex);
        expect(component.playerStats.avatar).toBe(initialAvatar);

        // Test wrapping around at the end
        // Set to last portrait
        component.currentPortraitIndex = component.totalPortraits - 1;
        component.playerStats.avatar = component.currentPortraitImage;

        // Move forward should wrap to beginning
        component.navigatePortrait('next');
        expect(component.currentPortraitIndex).toBe(0);

        // Test wrapping around at the beginning
        component.currentPortraitIndex = 0;
        component.playerStats.avatar = component.currentPortraitImage;

        // Move backward should wrap to end
        component.navigatePortrait('prev');
        expect(component.currentPortraitIndex).toBe(component.totalPortraits - 1);
    });

    it('should update stat values when selectStat is called', () => {
        // Test stat values change correctly when selecting life
        component.playerStats.life = 4;
        component.playerStats.speed = 4;
        component.lifeSelected = false;
        component.speedSelected = false;

        // Selecting life should increase its value by 2
        component.selectStat('life');
        expect(component.lifeSelected).toBeTrue();
        expect(component.playerStats.life).toBe(6);

        // Toggling life off should decrease its value by 2
        component.selectStat('life');
        expect(component.lifeSelected).toBeFalse();
        expect(component.playerStats.life).toBe(4);

        // Test mutual exclusivity - selecting speed after life
        component.selectStat('life');
        expect(component.lifeSelected).toBeTrue();
        component.selectStat('speed');
        expect(component.lifeSelected).toBeFalse();
        expect(component.speedSelected).toBeTrue();
        expect(component.playerStats.life).toBe(4);
        expect(component.playerStats.speed).toBe(6);
    });

    it('should update takenAvatars when onPlayerJoined is triggered', () => {
        // Setup for non-creation page
        component.isCreationPage = false;

        // Create mock players with avatars
        const mockPlayers = [{ avatar: 'avatar1.png' }, { avatar: 'avatar2.png' }] as PlayerStats[];

        // Empty initial takenAvatars
        component.takenAvatars = [];

        // Trigger the onPlayerJoined event
        mockSocketService.triggerPlayerJoined({ room: { players: mockPlayers } });

        // Verify takenAvatars has been updated
        expect(component.takenAvatars).toEqual(['avatar1.png', 'avatar2.png']);

        // Test that takenAvatars doesn't update in creation page mode
        component.isCreationPage = true;
        component.takenAvatars = [];

        mockSocketService.triggerPlayerJoined({ room: { players: mockPlayers } });

        // Avatars should not be updated when in creation page
        expect(component.takenAvatars).toEqual([]);
    });

    it('should check if current avatar is taken', () => {
        component.takenAvatars = [ASSET_PATH + '1' + ASSET_EXT, ASSET_PATH + '3' + ASSET_EXT];

        // Set to a taken avatar
        component.currentPortraitIndex = 0; // For portrait 1
        expect(component.isCurrentAvatarTaken).toBeTrue();

        // Set to an available avatar
        component.currentPortraitIndex = 1; // For portrait 2
        expect(component.isCurrentAvatarTaken).toBeFalse();
    });

    it('should initialize takenAvatars from gameRoom on init', () => {
        // Setup
        const mockPlayers = [{ avatar: 'avatar1.png' }, { avatar: 'avatar2.png' }] as PlayerStats[];

        mockSocketService.gameRoom = {
            ...mockSocketService.gameRoom,
            players: mockPlayers,
        };

        // Reset takenAvatars
        component.takenAvatars = [];
        component.isCreationPage = false;

        // Call ngOnInit
        component.ngOnInit();

        // Verify takenAvatars is initialized from gameRoom
        expect(component.takenAvatars).toEqual(['avatar1.png', 'avatar2.png']);
    });

    it('should set isRoomLocked to true when room locked event occurs', () => {
        spyOn(mockSocketService, 'onRoomLocked').and.returnValue(of(null));
        // Ré-initialiser le composant afin que ngOnInit se réexécute et prenne en compte le spy
        component.isRoomLocked = false;
        component.ngOnInit();
        expect(component.isRoomLocked).toBeTrue();
    });

    it('should create game and navigate to lobby', fakeAsync(() => {
        spyOn(mockSocketService, 'createRoom');
        spyOn(mockSocketService, 'createGame');
        spyOn(mockSocketService, 'shareCharacter');
        spyOn(mockSocketService, 'onRoomCreated').and.returnValue(of({ accessCode: 'LobbyCode' }));

        component.createGame();
        tick();

        expect(mockSocketService.createRoom).toHaveBeenCalledWith(15);
        expect(mockSocketService.createGame).toHaveBeenCalledWith('LobbyCode', 'Test Map');
        expect(mockSocketService.shareCharacter).toHaveBeenCalledWith('LobbyCode', component.playerStats);
        expect(component.accessCode).toBe('LobbyCode');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/lobby'], { state: { accessCode: 'LobbyCode' } });
    }));
});
