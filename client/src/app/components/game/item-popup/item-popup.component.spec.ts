import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GameService } from '@app/services/game/game.service';
import { Vec2 } from '@common/board';
import { Item } from '@common/enums';
import { ItemPopupComponent } from './item-popup.component';

describe('ItemPopupComponent', () => {
    let component: ItemPopupComponent;
    let fixture: ComponentFixture<ItemPopupComponent>;
    let fakeDialogRef: jasmine.SpyObj<MatDialogRef<ItemPopupComponent>>;
    let fakeGameService: jasmine.SpyObj<GameService>;

    const testData = {
        inventory: [Item.Sword, Item.Bow, Item.LeatherBoot],
        collectedPosition: { x: 1, y: 2 } as Vec2,
    };

    beforeEach(async () => {
        fakeDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
        fakeGameService = jasmine.createSpyObj('GameService', ['handleInventoryChoice']);

        await TestBed.configureTestingModule({
            imports: [ItemPopupComponent],
            providers: [
                { provide: MatDialogRef, useValue: fakeDialogRef },
                { provide: GameService, useValue: fakeGameService },
                { provide: MAT_DIALOG_DATA, useValue: testData },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ItemPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and initialize values correctly', () => {
        expect(component).toBeTruthy();
        expect(component.items).toEqual(testData.inventory);
        expect(component.newItem).toEqual(testData.inventory[testData.inventory.length - 1]);
        expect(component.collectedPosition).toEqual(testData.collectedPosition);
    });

    it('should call gameService.handleInventoryChoice and close the dialog when an item is selected', () => {
        const selectedItem = Item.Sword;
        component.selectItemToThrow(selectedItem);
        expect(fakeGameService.handleInventoryChoice).toHaveBeenCalledWith(
            testData.collectedPosition,
            selectedItem,
            testData.inventory[testData.inventory.length - 1],
        );
        expect(fakeDialogRef.close).toHaveBeenCalled();
    });
});
