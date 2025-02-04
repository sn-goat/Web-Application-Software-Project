import { Component, Input } from '@angular/core';
import { EditDragDrop } from '@app/classes/edit-drag-drop/edit-drag-drop';
import { ItemType } from '@common/enums';

@Component({
    selector: 'app-edit-tool-item',
    templateUrl: './edit-tool-item.component.html',
    styleUrl: './edit-tool-item.component.scss',
    imports: [],
})
export class EditToolItemComponent {
    @Input() type: string;
    @Input() alternate: string;

    src = './assets/items/';
    fileType = '.png';

    isDraggable = true;

    readonly maxVariableItem = 6;

    chestType: string = ItemType.Chest0;
    spawnType: string = ItemType.Spawn0;

    chestCounter = 0;
    spawnCounter = 0;

    constructor(private editDragDrop: EditDragDrop) {
        this.editDragDrop.wasDragged$.subscribe((wasDragged) => {
            if (this.type !== ItemType.Chest && this.type !== ItemType.Spawn) {
                this.isDraggable = wasDragged.find((type) => type === this.type) === undefined;
            }
        });
        this.editDragDrop.setChests$.subscribe((chests) => {
            if (this.type === ItemType.Chest) {
                if (chests.size === 0) {
                    this.chestCounter = 0;
                    this.chestType = ItemType.Chest0;
                    this.isDraggable = true;
                }

                if (this.chestCounter < chests.size) {
                    this.chestCounter += 1;
                    this.chestType = ItemType.Chest + this.chestCounter;
                    this.isDraggable = this.chestCounter < this.maxVariableItem;
                }
            }
        });
        this.editDragDrop.setSpawns$.subscribe((spawns) => {
            if (this.type === ItemType.Spawn) {
                if (spawns.size === 0) {
                    this.spawnCounter = 0;
                    this.spawnType = ItemType.Spawn0;
                    this.isDraggable = true;
                }

                if (this.spawnCounter < spawns.size) {
                    this.spawnCounter += 1;
                    this.spawnType = ItemType.Spawn + this.spawnCounter;
                    this.isDraggable = this.spawnCounter < this.maxVariableItem;
                }
            }
        });
    }

    onDragStart(event: DragEvent) {
        event.preventDefault();
        if (this.type === ItemType.Chest) {
            this.editDragDrop.setCurrentItem(this.chestType);
        } else if (this.type === ItemType.Spawn) {
            this.editDragDrop.setCurrentItem(this.spawnType);
        } else {
            this.editDragDrop.setCurrentItem(this.type);
        }
        this.editDragDrop.setIsOnItemContainer(false);
    }

    onDragEnter(event: MouseEvent) {
        event.preventDefault();
        this.editDragDrop.setIsOnItemContainer(true);
    }
}
