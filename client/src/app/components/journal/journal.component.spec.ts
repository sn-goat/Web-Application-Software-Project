import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { Entry, FightMessage, GameMessage } from '@common/journal';
import { BehaviorSubject } from 'rxjs';
import { JournalComponent } from './journal.component';

@Component({
    standalone: true,
    imports: [JournalComponent],
    template: '<app-journal></app-journal>',
})
class TestHostComponent {}

describe('JournalComponent', () => {
    let component: JournalComponent;
    let fixture: ComponentFixture<TestHostComponent>;
    let gameServiceMock: jasmine.SpyObj<GameService>;
    let playerServiceMock: jasmine.SpyObj<PlayerService>;

    const testPlayerId = 'player123';
    const mockEntries: Entry[] = [
        {
            messageType: GameMessage.QUIT,
            message: GameMessage.QUIT + 'Jean',
            accessCode: 'ABC123',
            playersInvolved: ['otherPlayer456'],
        },
        {
            messageType: GameMessage.START_TURN,
            message: GameMessage.START_TURN + 'vous',
            accessCode: 'ABC123',
            playersInvolved: [testPlayerId],
        },
    ];

    const entriesSubject = new BehaviorSubject<Entry[]>(mockEntries);
    const playerSubject = new BehaviorSubject<{ id: string }>({ id: testPlayerId });

    beforeEach(async () => {
        gameServiceMock = jasmine.createSpyObj('GameService', [], {
            journalEntries: entriesSubject.asObservable(),
        });

        playerServiceMock = jasmine.createSpyObj('PlayerService', [], {
            myPlayer: playerSubject.asObservable(),
        });

        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [
                { provide: GameService, useValue: gameServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        const journalDebugElement = fixture.debugElement.children[0];
        component = journalDebugElement.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle filter state when toggleFilter is called', () => {
        expect(component.isFilterActive).toBeFalse();
        component.toggleFilter();
        expect(component.isFilterActive).toBeTrue();
        component.toggleFilter();
        expect(component.isFilterActive).toBeFalse();
    });

    describe('shouldDisplayEntry', () => {
        it('should return true for all entries when filter is inactive', () => {
            component.isFilterActive = false;

            const entryNotInvolved: Entry = {
                messageType: GameMessage.OPEN_DOOR,
                message: GameMessage.OPEN_DOOR + 'Marie',
                accessCode: 'ABC123',
                playersInvolved: ['someOtherId'],
            };
            expect(component.shouldDisplayEntry(entryNotInvolved)).toBeTrue();

            const entryInvolved: Entry = {
                messageType: FightMessage.ATTACK,
                message: FightMessage.ATTACK + 'vous',
                accessCode: 'ABC123',
                playersInvolved: [testPlayerId],
            };
            expect(component.shouldDisplayEntry(entryInvolved)).toBeTrue();
        });

        it('should only return true for entries involving the player when filter is active', () => {
            component.isFilterActive = true;

            const entryNotInvolved: Entry = {
                messageType: GameMessage.CLOSE_DOOR,
                message: GameMessage.CLOSE_DOOR + 'Pierre',
                accessCode: 'ABC123',
                playersInvolved: ['someOtherId'],
            };
            expect(component.shouldDisplayEntry(entryNotInvolved)).toBeFalse();
        });
    });

    it('should unsubscribe from all subscriptions when destroyed', () => {
        const subscriptionSpies = component['subscriptions'].map((subscription) => spyOn(subscription, 'unsubscribe').and.callThrough());

        component.ngOnDestroy();

        subscriptionSpies.forEach((spy) => {
            expect(spy).toHaveBeenCalled();
        });
    });

    it('should update entries when new entries are emitted', () => {
        const newEntries: Entry[] = [
            {
                messageType: GameMessage.END_GAME,
                message: GameMessage.END_GAME + 'Marie',
                accessCode: 'ABC123',
                playersInvolved: ['otherPlayer789'],
            },
        ];

        entriesSubject.next(newEntries);
        expect(component.journalEntries).toEqual(newEntries);
    });

    it('should update myPlayerId when player changes', () => {
        const newPlayerId = 'newPlayer456';
        playerSubject.next({ id: newPlayerId });
        expect(component.myPlayerId).toBe(newPlayerId);
    });
});
