/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sort } from '@angular/material/sort';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';

import { StatsComponent } from '@app/components/stats/stats.component';
import { GameService } from '@app/services/game/game.service';
import { Stats, mockStandardStats } from '@common/stats';

describe('StatsComponent', () => {
    let component: StatsComponent;
    let fixture: ComponentFixture<StatsComponent>;
    let gameServiceMock: jasmine.SpyObj<GameService>;
    let statsSubject: BehaviorSubject<Stats | null>;

    beforeEach(async () => {
        statsSubject = new BehaviorSubject<Stats | null>(null);
        gameServiceMock = jasmine.createSpyObj('GameService', [], { stats: statsSubject });

        await TestBed.configureTestingModule({
            imports: [StatsComponent, NoopAnimationsModule],
            providers: [{ provide: GameService, useValue: gameServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(StatsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not update dataSource if stats is null', () => {
        expect(component.stats).toBeNull();
        expect(component.dataSource.data.length).toBe(0);

        statsSubject.next(null);
        fixture.detectChanges();

        expect(component.stats).toBeNull();
        expect(component.dataSource.data.length).toBe(0);
    });

    it('should update dataSource when receiving stats', () => {
        statsSubject.next(mockStandardStats);
        fixture.detectChanges();

        expect(component.stats).toBe(mockStandardStats);

        const expectedLength = mockStandardStats.playersStats.length + mockStandardStats.disconnectedPlayersStats.length;
        expect(component.dataSource.data.length).toBe(expectedLength);

        const connectedPlayer = component.dataSource.data.find((p) => p.name === mockStandardStats.playersStats[0].name);
        expect(connectedPlayer?.isDisconnected).toBeFalse();

        const disconnectedPlayer = component.dataSource.data.find((p) => p.name === mockStandardStats.disconnectedPlayersStats[0].name);
        expect(disconnectedPlayer?.isDisconnected).toBeTrue();
    });

    describe('sortData', () => {
        beforeEach(() => {
            statsSubject.next(mockStandardStats);
            fixture.detectChanges();
        });

        it('should not sort data if sort is not active', () => {
            const initialData = [...component.dataSource.data];
            const sort: Sort = { active: '', direction: '' };

            component.sortData(sort);

            expect(component.dataSource.data).toEqual(initialData);
        });

        it('should sort by name ascending', () => {
            const sort: Sort = { active: 'name', direction: 'asc' };

            component.sortData(sort);

            expect(component.dataSource.data[0].name <= component.dataSource.data[1].name).toBeTrue();
        });

        it('should sort by name descending', () => {
            const sort: Sort = { active: 'name', direction: 'desc' };

            component.sortData(sort);

            expect(component.dataSource.data[0].name >= component.dataSource.data[1].name).toBeTrue();
        });

        it('should sort numeric columns correctly (wins ascending)', () => {
            const sort: Sort = { active: 'wins', direction: 'asc' };

            component.sortData(sort);

            expect(component.dataSource.data[0].wins).toBeLessThanOrEqual(component.dataSource.data[component.dataSource.data.length - 1].wins);
        });

        it('should sort numeric columns correctly (wins descending)', () => {
            const sort: Sort = { active: 'wins', direction: 'desc' };

            component.sortData(sort);

            expect(component.dataSource.data[0].wins).toBeGreaterThanOrEqual(component.dataSource.data[component.dataSource.data.length - 1].wins);
        });

        it('should sort percentage columns correctly', () => {
            const sort: Sort = { active: 'tilesVisitedPercentage', direction: 'asc' };

            component.sortData(sort);

            const firstPercentage = parseFloat(component.dataSource.data[0].tilesVisitedPercentage?.replace('%', '') || '0');
            const lastPercentage = parseFloat(
                component.dataSource.data[component.dataSource.data.length - 1].tilesVisitedPercentage?.replace('%', '') || '0',
            );
            expect(firstPercentage).toBeLessThanOrEqual(lastPercentage);
        });

        it('should sort itemsPickedCount correctly', () => {
            const sort: Sort = { active: 'itemsPickedCount', direction: 'desc' };

            component.sortData(sort);

            const firstCount = component.dataSource.data[0].itemsPickedCount || 0;
            const lastCount = component.dataSource.data[component.dataSource.data.length - 1].itemsPickedCount || 0;
            expect(firstCount).toBeGreaterThanOrEqual(lastCount);
        });

        it('should sort totalFights correctly', () => {
            const sort: Sort = { active: 'totalFights', direction: 'desc' };

            component.sortData(sort);

            const firstFights = component.dataSource.data[0].totalFights || 0;
            const lastFights = component.dataSource.data[component.dataSource.data.length - 1].totalFights || 0;
            expect(firstFights).toBeGreaterThanOrEqual(lastFights);
        });

        it('should handle unknown columns gracefully', () => {
            const initialData = [...component.dataSource.data];
            const sort: Sort = { active: 'unknownColumn', direction: 'asc' };

            component.sortData(sort);

            expect(component.dataSource.data).toEqual(initialData);
        });

        it('should handle null values when parsing percentages', () => {
            const testData = [...component.dataSource.data];
            testData[0].tilesVisitedPercentage = undefined;
            component.dataSource.data = testData;

            const sort: Sort = { active: 'tilesVisitedPercentage', direction: 'asc' };

            expect(() => component.sortData(sort)).not.toThrow();

            expect(component.dataSource.data[0].tilesVisitedPercentage).toBeUndefined();
        });

        it('should sort itemsPickedCount correctly (ascending)', () => {
            const sort: Sort = { active: 'itemsPickedCount', direction: 'asc' };

            component.sortData(sort);

            const firstCount = component.dataSource.data[0].itemsPickedCount || 0;
            const lastCount = component.dataSource.data[component.dataSource.data.length - 1].itemsPickedCount || 0;
            expect(firstCount).toBeLessThanOrEqual(lastCount);
        });

        it('should sort itemsPickedCount correctly (descending)', () => {
            const sort: Sort = { active: 'itemsPickedCount', direction: 'desc' };

            component.sortData(sort);

            const firstCount = component.dataSource.data[0].itemsPickedCount || 0;
            const lastCount = component.dataSource.data[component.dataSource.data.length - 1].itemsPickedCount || 0;
            expect(firstCount).toBeGreaterThanOrEqual(lastCount);
        });

        it('should sort totalFights correctly (ascending)', () => {
            const sort: Sort = { active: 'totalFights', direction: 'asc' };

            component.sortData(sort);

            const firstFights = component.dataSource.data[0].totalFights || 0;
            const lastFights = component.dataSource.data[component.dataSource.data.length - 1].totalFights || 0;
            expect(firstFights).toBeLessThanOrEqual(lastFights);
        });

        it('should sort totalFights correctly (descending)', () => {
            const sort: Sort = { active: 'totalFights', direction: 'desc' };

            component.sortData(sort);

            const firstFights = component.dataSource.data[0].totalFights || 0;
            const lastFights = component.dataSource.data[component.dataSource.data.length - 1].totalFights || 0;
            expect(firstFights).toBeGreaterThanOrEqual(lastFights);
        });

        it('should sort tilesVisitedPercentage correctly (ascending)', () => {
            const sort: Sort = { active: 'tilesVisitedPercentage', direction: 'asc' };

            component.sortData(sort);

            const firstPercentage = parseFloat(component.dataSource.data[0].tilesVisitedPercentage?.replace('%', '') || '0');
            const lastPercentage = parseFloat(
                component.dataSource.data[component.dataSource.data.length - 1].tilesVisitedPercentage?.replace('%', '') || '0',
            );
            expect(firstPercentage).toBeLessThanOrEqual(lastPercentage);
        });

        it('should sort tilesVisitedPercentage correctly (descending)', () => {
            const sort: Sort = { active: 'tilesVisitedPercentage', direction: 'desc' };

            component.sortData(sort);

            const firstPercentage = parseFloat(component.dataSource.data[0].tilesVisitedPercentage?.replace('%', '') || '0');
            const lastPercentage = parseFloat(
                component.dataSource.data[component.dataSource.data.length - 1].tilesVisitedPercentage?.replace('%', '') || '0',
            );
            expect(firstPercentage).toBeGreaterThanOrEqual(lastPercentage);
        });

        it('should return 0 for default case when column is unknown', () => {
            spyOn<any>(component, 'compareByColumn').and.callThrough();

            const sort: Sort = { active: 'unknownColumn', direction: 'asc' };

            component.sortData(sort);

            expect(component['compareByColumn']).toHaveBeenCalled();

            const callArgs = (component['compareByColumn'] as jasmine.Spy).calls.argsFor(0);
            expect(callArgs[2]).toBe('unknownColumn');

            const testPlayerA = component.dataSource.data[0];
            const testPlayerB = component.dataSource.data[1];

            const result = (component as any).compareByColumn(testPlayerA, testPlayerB, 'unknownColumn', true);
            expect(result).toBe(0);

            const nameResult = (component as any).compareByColumn(testPlayerA, testPlayerB, 'name', true);
            expect(typeof nameResult).toBe('number');

            const winsResult = (component as any).compareByColumn(testPlayerA, testPlayerB, 'wins', true);
            expect(typeof winsResult).toBe('number');

            const itemsResult = (component as any).compareByColumn(testPlayerA, testPlayerB, 'itemsPickedCount', true);
            expect(typeof itemsResult).toBe('number');

            const fightsResult = (component as any).compareByColumn(testPlayerA, testPlayerB, 'totalFights', true);
            expect(typeof fightsResult).toBe('number');

            const tilesResult = (component as any).compareByColumn(testPlayerA, testPlayerB, 'tilesVisitedPercentage', true);
            expect(typeof tilesResult).toBe('number');
        });

        it('should handle null/undefined values in itemsPickedCount', () => {
            const testData = [...component.dataSource.data];
            testData[0].itemsPickedCount = undefined;
            component.dataSource.data = testData;

            const sort: Sort = { active: 'itemsPickedCount', direction: 'asc' };

            expect(() => component.sortData(sort)).not.toThrow();
        });

        it('should handle null/undefined values in totalFights', () => {
            const testData = [...component.dataSource.data];
            testData[0].totalFights = undefined;
            component.dataSource.data = testData;

            const sort: Sort = { active: 'totalFights', direction: 'asc' };

            expect(() => component.sortData(sort)).not.toThrow();
        });
    });

    describe('parsePercentage', () => {
        it('should parse percentage strings correctly', () => {
            const parsePercentage = (component as any).parsePercentage.bind(component);

            expect(parsePercentage('15%')).toBe(15);
            expect(parsePercentage('0%')).toBe(0);
            expect(parsePercentage('100%')).toBe(100);
            expect(parsePercentage('')).toBe(0);
            expect(parsePercentage(undefined)).toBe(0);
        });
    });

    describe('compareByColumn', () => {
        beforeEach(() => {
            statsSubject.next(mockStandardStats);
            fixture.detectChanges();
        });

        it('should compare by name correctly', () => {
            const playerA = { ...mockStandardStats.playersStats[0], name: 'AAA', isDisconnected: false };
            const playerB = { ...mockStandardStats.playersStats[1], name: 'ZZZ', isDisconnected: false };

            const result1 = (component as any).compareByColumn(playerA, playerB, 'name', true);
            const result2 = (component as any).compareByColumn(playerA, playerB, 'name', false);

            expect(result1).toBeLessThan(0);
            expect(result2).toBeGreaterThan(0);
        });

        it('should compare numeric properties correctly', () => {
            const playerA = { ...mockStandardStats.playersStats[0], wins: 5, isDisconnected: false };
            const playerB = { ...mockStandardStats.playersStats[1], wins: 10, isDisconnected: false };

            const winsAsc = (component as any).compareByColumn(playerA, playerB, 'wins', true);
            const winsDesc = (component as any).compareByColumn(playerA, playerB, 'wins', false);
            expect(winsAsc).toBeLessThan(0);
            expect(winsDesc).toBeGreaterThan(0);

            playerA.losses = 2;
            playerB.losses = 1;
            expect((component as any).compareByColumn(playerA, playerB, 'losses', true)).toBeGreaterThan(0);

            playerA.givenDamage = 100;
            playerB.givenDamage = 50;
            expect((component as any).compareByColumn(playerA, playerB, 'givenDamage', true)).toBeGreaterThan(0);

            playerA.takenDamage = 20;
            playerB.takenDamage = 40;
            expect((component as any).compareByColumn(playerA, playerB, 'takenDamage', true)).toBeLessThan(0);

            playerA.fleeSuccess = 3;
            playerB.fleeSuccess = 1;
            expect((component as any).compareByColumn(playerA, playerB, 'fleeSuccess', true)).toBeGreaterThan(0);
        });

        it('should compare itemsPickedCount correctly', () => {
            const playerA = { ...mockStandardStats.playersStats[0], itemsPickedCount: 3, isDisconnected: false };
            const playerB = { ...mockStandardStats.playersStats[1], itemsPickedCount: 5, isDisconnected: false };

            expect((component as any).compareByColumn(playerA, playerB, 'itemsPickedCount', true)).toBeLessThan(0);
            expect((component as any).compareByColumn(playerA, playerB, 'itemsPickedCount', false)).toBeGreaterThan(0);

            const playerC = { ...mockStandardStats.playersStats[2], itemsPickedCount: undefined, isDisconnected: false };
            expect((component as any).compareByColumn(playerC, playerB, 'itemsPickedCount', true)).toBeLessThan(0);
        });

        it('should compare totalFights correctly', () => {
            const playerA = { ...mockStandardStats.playersStats[0], totalFights: 8, isDisconnected: false };
            const playerB = { ...mockStandardStats.playersStats[1], totalFights: 4, isDisconnected: false };

            expect((component as any).compareByColumn(playerA, playerB, 'totalFights', true)).toBeGreaterThan(0);
            expect((component as any).compareByColumn(playerA, playerB, 'totalFights', false)).toBeLessThan(0);

            const playerC = { ...mockStandardStats.playersStats[2], totalFights: undefined, isDisconnected: false };
            expect((component as any).compareByColumn(playerC, playerB, 'totalFights', true)).toBeLessThan(0);
        });

        it('should compare tilesVisitedPercentage correctly', () => {
            const playerA = { ...mockStandardStats.playersStats[0], tilesVisitedPercentage: '25%', isDisconnected: false };
            const playerB = { ...mockStandardStats.playersStats[1], tilesVisitedPercentage: '50%', isDisconnected: false };

            expect((component as any).compareByColumn(playerA, playerB, 'tilesVisitedPercentage', true)).toBeLessThan(0);
            expect((component as any).compareByColumn(playerA, playerB, 'tilesVisitedPercentage', false)).toBeGreaterThan(0);

            const playerC = { ...mockStandardStats.playersStats[2], tilesVisitedPercentage: undefined, isDisconnected: false };
            expect((component as any).compareByColumn(playerC, playerB, 'tilesVisitedPercentage', true)).toBeLessThan(0);
        });

        it('should return 0 for unknown columns', () => {
            const playerA = mockStandardStats.playersStats[0];
            const playerB = mockStandardStats.playersStats[1];

            expect((component as any).compareByColumn(playerA, playerB, 'unknownColumn', true)).toBe(0);
            expect((component as any).compareByColumn(playerA, playerB, 'anotherUnknown', false)).toBe(0);
        });
    });
});
