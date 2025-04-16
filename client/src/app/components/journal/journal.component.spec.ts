import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { Entry, GameMessage } from '@common/journal';
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
    const mockEntries: Set<Entry> = new Set<Entry>([
        {
            isFight: false,
            message: GameMessage.AttackInit + 'Jean',
            playersInvolved: ['otherPlayer456'],
        },
        {
            isFight: false,
            message: GameMessage.StartTurn + 'vous',
            playersInvolved: [testPlayerId],
        },
    ]);

    const entriesSubject = new BehaviorSubject<Set<Entry>>(mockEntries);
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
                isFight: false,
                message: GameMessage.OpenDoor + 'Marie',
                playersInvolved: ['someOtherId'],
            };
            expect(component.shouldDisplayEntry(entryNotInvolved)).toBeTrue();

            const entryInvolved: Entry = {
                isFight: false,
                message: GameMessage.AttackInit + 'vous',
                playersInvolved: [testPlayerId],
            };
            expect(component.shouldDisplayEntry(entryInvolved)).toBeTrue();
        });

        it('should only return true for entries involving the player when filter is active', () => {
            component.isFilterActive = true;

            const entryNotInvolved: Entry = {
                isFight: false,
                message: GameMessage.CloseDoor + 'Pierre',
                playersInvolved: ['someOtherId'],
            };
            expect(component.shouldDisplayEntry(entryNotInvolved)).toBeFalse();
        });
    });

    it('should update entries when journalEntries changes', () => {
        const newEntries: Set<Entry> = new Set<Entry>([
            {
                isFight: false,
                message: GameMessage.AttackInit + 'Marie',
                playersInvolved: ['someOtherId'],
            },
        ]);
        entriesSubject.next(newEntries);
        expect(component.journalEntries).toEqual(newEntries);
    });

    it('should update myPlayerId when player changes', () => {
        const newPlayerId = 'newPlayer456';
        playerSubject.next({ id: newPlayerId });
        expect(component.myPlayerId).toBe(newPlayerId);
    });
});
