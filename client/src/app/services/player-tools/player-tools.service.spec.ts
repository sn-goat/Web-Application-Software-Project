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

    it('should add an item if it is not DEFAULT', (done) => {
        // Initial items should be empty
        service.items$.pipe(take(1)).subscribe((items) => {
            expect(items.length).toBe(0);
        });

        service.addItem(Item.BOW);
        service.items$.pipe(take(1)).subscribe((items) => {
            expect(items.length).toBe(1);
            expect(items[0]).toBe(Item.BOW);
        });

        // Add second item
        service.addItem(Item.SWORD);
        service.items$.pipe(take(1)).subscribe((items) => {
            expect(items.length).toBe(2);
            expect(items).toEqual([Item.BOW, Item.SWORD]);
        });

        // Adding a new item when 2 are already there should pop le dernier et ajouter le nouvel item
        service.addItem(Item.SHIELD);
        service.items$.pipe(take(1)).subscribe((items) => {
            expect(items.length).toBe(2);
            // La logique: items[0] reste, items[1] devient la nouvelle valeur
            expect(items).toEqual([Item.BOW, Item.SHIELD]);
            done();
        });
    });

    it('should not add DEFAULT item', (done) => {
        service.addItem(Item.DEFAULT);
        service.items$.pipe(take(1)).subscribe((items) => {
            expect(items.length).toBe(0);
            done();
        });
    });

    it('should remove an item correctly', (done) => {
        // Pré-remplissage de quelques items
        service.addItem(Item.BOW);
        service.addItem(Item.SWORD);

        // Vérifier que les items ont été ajoutés
        service.items$.pipe(take(1)).subscribe((items) => {
            expect(items.length).toBe(2);

            // Suppression d'un item
            service.removeItem(Item.BOW);
            service.items$.pipe(take(1)).subscribe((updatedItems) => {
                expect(updatedItems).toEqual([Item.SWORD]);
                done();
            });
        });
    });
});