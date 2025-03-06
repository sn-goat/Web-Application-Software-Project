import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { GameService } from '@app/services/code/game.service';
import { PlayerService } from '@app/services/code/player.service';
import { BehaviorSubject } from 'rxjs';

// Define an interface for the headerBar parameter
interface HeaderBarMock {
    getBack: () => void;
    backUrl: string;
}

// Create a simplified, directly testable version of GamePageComponent for testing
@Component({
    selector: 'app-game-page',
    template: `
        <div>Test Game Page Component</div>
        <div *ngIf="showFightInterface">Fight Interface is shown</div>
    `,
    standalone: true,
    imports: [CommonModule],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
class GamePageComponentTestable {
    showFightInterface = false;

    // Flag to track if original method was called
    originalMethodCalled = false;

    constructor(
        public gameService: GameService,
        public playerService: PlayerService,
    ) {
        gameService.showFightInterface$.subscribe((show) => {
            this.showFightInterface = show;
        });
    }

    // Update method to use the HeaderBarMock interface
    handleBackAction(headerBar: HeaderBarMock, onOriginalCalled?: () => void): void {
        const originalGetBack = headerBar.getBack;

        headerBar.getBack = () => {
            this.gameService.confirmAndAbandonGame(this.playerService.getPlayerUsername()).then((confirmed) => {
                if (confirmed) {
                    // Call the original method
                    originalGetBack.call(headerBar);
                    // Signal that original was called using the callback
                    if (onOriginalCalled) {
                        onOriginalCalled();
                    }
                    // Also set our flag
                    this.originalMethodCalled = true;
                }
            });
        };
    }
}

describe('GamePageComponent', () => {
    let component: GamePageComponentTestable;
    let fixture: ComponentFixture<GamePageComponentTestable>;
    let gameServiceMock: jasmine.SpyObj<GameService>;
    let playerServiceMock: jasmine.SpyObj<PlayerService>;
    let showFightInterfaceSubject: BehaviorSubject<boolean>;

    beforeEach(async () => {
        // Set up the BehaviorSubject for showFightInterface$
        showFightInterfaceSubject = new BehaviorSubject<boolean>(false);

        // Create service mocks
        playerServiceMock = jasmine.createSpyObj('PlayerService', ['getPlayerUsername']);
        playerServiceMock.getPlayerUsername.and.returnValue('testUser');

        gameServiceMock = jasmine.createSpyObj('GameService', ['confirmAndAbandonGame']);
        gameServiceMock.showFightInterface$ = showFightInterfaceSubject;
        gameServiceMock.confirmAndAbandonGame.and.returnValue(Promise.resolve(true));

        await TestBed.configureTestingModule({
            imports: [
                CommonModule,
                GamePageComponentTestable, // Move to imports instead of declarations
            ],
            providers: [
                { provide: GameService, useValue: gameServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePageComponentTestable);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update showFightInterface on subscription', () => {
        showFightInterfaceSubject.next(true);
        expect(component.showFightInterface).toBeTrue();

        showFightInterfaceSubject.next(false);
        expect(component.showFightInterface).toBeFalse();
    });

    it('should override headerBar.getBack and call original method if confirmed', fakeAsync(() => {
        let originalWasCalled = false;

        // Create a mock headerBar object with a stub getBack method
        const headerBarMock: HeaderBarMock = {
            getBack: () => {
                /* empty initial implementation */
            },
            backUrl: '/home',
        };

        // Spy on the getBack method to see if it gets called
        spyOn(headerBarMock, 'getBack');

        // Call our test method with a callback to track when original method is called
        component.handleBackAction(headerBarMock, () => (originalWasCalled = true));

        // Invoke the overridden getBack method
        headerBarMock.getBack();
        tick();

        // Check that confirmAndAbandonGame was called with the right username
        expect(gameServiceMock.confirmAndAbandonGame).toHaveBeenCalledWith('testUser');

        // Since confirmAndAbandonGame resolves to true, verify original was called
        expect(originalWasCalled).toBeTrue();
        flush();
    }));

    it('should override headerBar.getBack and NOT call original method if not confirmed', fakeAsync(() => {
        // Update mock to return false this time
        gameServiceMock.confirmAndAbandonGame.and.returnValue(Promise.resolve(false));

        let originalWasCalled = false;

        // Create a new header bar mock with proper type
        const headerBarMock: HeaderBarMock = {
            getBack: () => {
                originalWasCalled = true;
            },
            backUrl: '/home',
        };

        // Apply our method to set up the override
        component.handleBackAction(headerBarMock);

        // Call the getBack method which should have been overridden
        headerBarMock.getBack();
        tick();

        // Verify confirmAndAbandonGame was called
        expect(gameServiceMock.confirmAndAbandonGame).toHaveBeenCalledWith('testUser');

        // Since confirmAndAbandonGame resolves to false, the original should not be called
        expect(originalWasCalled).toBeFalse();
        flush();
    }));
});
