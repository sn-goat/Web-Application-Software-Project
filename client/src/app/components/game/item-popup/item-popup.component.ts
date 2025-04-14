import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { GameService } from '@app/services/game/game.service';
import { Vec2 } from '@common/board';
import { Item } from '@common/enums';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-item-popup',
    templateUrl: './item-popup.component.html',
    styleUrls: ['./item-popup.component.scss'],
})
export class ItemPopupComponent implements OnInit, OnDestroy {
    data = inject<{
        inventory: Item[];
        collectedPosition: Vec2;
    }>(MAT_DIALOG_DATA);

    items: Item[] = [];
    newItem: Item;
    readonly src = DEFAULT_PATH_ITEMS;
    readonly fileType = DEFAULT_FILE_TYPE;
    collectedPosition: Vec2;
    private subscriptions: Subscription[] = [];
    private dialogRef = inject<MatDialogRef<ItemPopupComponent>>(MatDialogRef);
    private gameService = inject(GameService);

    ngOnInit(): void {
        this.items = this.data.inventory;
        this.newItem = this.items[this.items.length - 1];
        this.collectedPosition = this.data.collectedPosition;
    }

    selectItemToThrow(selectedItem: Item): void {
        this.gameService.handleInventoryChoice(this.collectedPosition, selectedItem, this.newItem);
        this.dialogRef.close();
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.subscriptions = [];
    }
}
