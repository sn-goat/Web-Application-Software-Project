import { TestBed } from '@angular/core/testing';
import { Item } from '@common/enums';
import { take } from 'rxjs/operators';
import { PlayerToolsService } from './player-tools.service';

describe('PlayerToolsService', () => {
    let service: PlayerToolsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [PlayerToolsService],
        });
        service = TestBed.inject(PlayerToolsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have initial timer value "00 s"', (done) => {
        service.timer$.pipe(take(1)).subscribe((timer) => {
            expect(timer).toBe('00 s');
            done();
        });
    });

    it('should set timer correctly', (done) => {
        const newTime = '10 s';
        service.setTimer(newTime);
        service.timer$.pipe(take(1)).subscribe((timer) => {
            expect(timer).toBe(newTime);
            done();
        });
    });

    it('should add an item if it is not Default', (done) => {
        // Initial items should be empty
        service.items$.pipe(take(1)).subscribe((items) => {
            expect(items.length).toBe(0);
        });

        service.addItem(Item.Bow);
        service.items$.pipe(take(1)).subscribe((items) => {
            expect(items.length).toBe(1);
            expect(items[0]).toBe(Item.Bow);
        });

        // Add second item
        service.addItem(Item.Sword);
        service.items$.pipe(take(1)).subscribe((items) => {
            expect(items.length).toBe(2);
            expect(items).toEqual([Item.Bow, Item.Sword]);
        });

        // Adding a new item when 2 are already there should pop le dernier et ajouter le nouvel item
        service.addItem(Item.Shield);
        service.items$.pipe(take(1)).subscribe((items) => {
            expect(items.length).toBe(2);
            expect(items).toEqual([Item.Bow, Item.Shield]);
            done();
        });
    });

    it('should not add Default item', (done) => {
        service.addItem(Item.Default);
        service.items$.pipe(take(1)).subscribe((items) => {
            expect(items.length).toBe(0);
            done();
        });
    });

    it('should remove an item correctly', (done) => {
        service.addItem(Item.Bow);
        service.addItem(Item.Sword);

        service.items$.pipe(take(1)).subscribe((items) => {
            expect(items.length).toBe(2);

            service.removeItem(Item.Bow);
            service.items$.pipe(take(1)).subscribe((updatedItems) => {
                expect(updatedItems).toEqual([Item.Sword]);
                done();
            });
        });
    });
});
