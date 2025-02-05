// import { Injectable } from '@angular/core';
// import { BehaviorSubject, Observable } from 'rxjs';
// import { BoardCell } from '@common/board';
// import { ItemType, TileType } from '@common/enums';
// import { Vec2 } from '@common/vec2';

// @Injectable({
//     providedIn: 'root',
// })
// export class EditDragDrop {
//     wasDragged$: Observable<string[]>;
//     currentItem$: Observable<string>;
//     mousePosition$: Observable<Vec2>;
//     isOnItemContainer$: Observable<boolean>;
//     setChests$: Observable<Set<string>>;
//     setSpawns$: Observable<Set<string>>;

//     private isSet = false;
//     private mousePosition = new BehaviorSubject<Vec2>({ x: -1, y: -1 });
//     private wasDragged = new BehaviorSubject<string[]>([]);
//     private currentItem = new BehaviorSubject<string>('');
//     private isOnItemContainer = new BehaviorSubject<boolean>(false);
//     private setChests = new BehaviorSubject<Set<string>>(new Set());
//     private setSpawns = new BehaviorSubject<Set<string>>(new Set());

//     constructor() {
//         this.wasDragged$ = this.wasDragged.asObservable();
//         this.currentItem$ = this.currentItem.asObservable();
//         this.mousePosition$ = this.mousePosition.asObservable();
//         this.isOnItemContainer$ = this.isOnItemContainer.asObservable();
//         this.setChests$ = this.setChests.asObservable();
//         this.setSpawns$ = this.setSpawns.asObservable();
//     }

//     setIsOnItemContainer(value: boolean) {
//         this.isOnItemContainer.next(value);
//     }

//     setCurrentItem(currentItem: string) {
//         if (ITEMS_TYPES.includes(currentItem) && currentItem !== ItemType.Default) {
//             this.currentItem.next(currentItem);
//             this.isSet = true;
//         } else {
//             this.isSet = false;
//         }
//     }

//     getCurrentItem() {
//         return this.currentItem.value;
//     }

//     setCurrentPosition(position: Vec2) {
//         this.mousePosition.next(position);
//     }

//     getCurrentPosition() {
//         return this.mousePosition.value;
//     }

//     onDrop(board: BoardCell[][], cell: BoardCell, itemMap: Map<string, Vec2[]>) {
//         const item = this.getCurrentItem();
//         if (this.isSet) {
//             this.handleItemDrop(item, board, cell, itemMap);
//             this.setCurrentItem('');
//         }
//     }

//     onDragLeave(board: BoardCell[][], itemMap: Map<string, Vec2[]>) {
//         if (this.getCurrentPosition().x !== -1 && this.getCurrentPosition().y !== -1) {
//             const item = this.getCurrentItem();
//             if (item !== ItemType.Default) {
//                 if (item.includes(ItemType.Chest)) {
//                     this.removeSetChests(item);
//                 } else if (item.includes(ItemType.Spawn)) {
//                     this.removeSetSpawns(item);
//                 } else {
//                     this.removeWasDragged(item);
//                 }
//                 const itemPositions = itemMap.get(item as ItemType);
//                 let pos;
//                 if (itemPositions) {
//                     pos = itemPositions[0];
//                     if (pos.x !== -1 && pos.y !== -1) {
//                         board[pos.x][pos.y].item = ItemType.Default;
//                     }
//                     itemPositions.push({ x: -1, y: -1 });
//                     itemPositions.shift();
//                     itemMap.set(item as ItemType, itemPositions);
//                 }
//             }
//         }
//     }

//     handleItemOnInvalidTile(cell: BoardCell, itemMap: Map<string, Vec2[]>, board: BoardCell[][]) {
//         this.handleExistingItemRemoval(cell, itemMap);
//         board[cell.position.x][cell.position.y].item = ItemType.Default;
//     }

//     private addSetChests(chest: string) {
//         this.setChests.next(new Set(this.setChests.value.add(chest)));
//     }

//     private removeSetChests(chest: string) {
//         if (this.setChests.value.delete(chest)) {
//             this.setChests.next(new Set(this.setChests.value));
//         }
//     }

//     private addSetSpawns(chest: string) {
//         this.setSpawns.next(new Set(this.setSpawns.value.add(chest)));
//     }

//     private removeSetSpawns(chest: string) {
//         if (this.setSpawns.value.delete(chest)) {
//             this.setSpawns.next(new Set(this.setSpawns.value));
//         }
//     }

//     private handleExistingItemRemoval(cell: BoardCell, itemMap: Map<string, Vec2[]>) {
//         if (cell.item.includes(ItemType.Chest)) {
//             this.removeSetChests(cell.item);
//         } else if (cell.item.includes(ItemType.Spawn)) {
//             this.removeSetSpawns(cell.item);
//         } else {
//             this.removeWasDragged(cell.item);
//         }
//         const itemPositions = itemMap.get(cell.item);
//         if (itemPositions) {
//             itemPositions.push({ x: -1, y: -1 });
//             itemPositions.shift();
//             itemMap.set(cell.item, itemPositions);
//         }
//     }

//     private addWasDragged(wasDragged: string) {
//         this.wasDragged.next([...this.wasDragged.value, wasDragged]);
//     }

//     private removeWasDragged(wasDragged: string) {
//         this.wasDragged.next(this.wasDragged.value.filter((item) => item !== wasDragged));
//     }

//     private handleItemDrop(item: string, board: BoardCell[][], cell: BoardCell, itemMap: Map<string, Vec2[]>) {
//         if (cell.tile === TileType.Opened_Door || cell.tile === TileType.Closed_Door || cell.tile === TileType.Wall) {
//             return;
//         }

//         if (cell.item !== item && cell.item !== ItemType.Default) {
//             this.handleExistingItemRemoval(cell, itemMap);
//         }

//         this.updateItemState(item, cell);
//         this.updateItemPositions(item, cell, itemMap, board);
//     }

//     private updateItemState(item: string, cell: BoardCell) {
//         if (item.includes(ItemType.Chest)) {
//             this.addSetChests(item);
//         } else if (item.includes(ItemType.Spawn)) {
//             this.addSetSpawns(item);
//         }

//         this.addWasDragged(item);

//         cell.item = item as ItemType;
//     }

//     private updateItemPositions(item: string, cell: BoardCell, itemMap: Map<string, Vec2[]>, board: BoardCell[][]) {
//         const itemPositions = itemMap.get(item);
//         if (itemPositions) {
//             itemPositions.push(cell.position);
//             this.clearOldPosition(itemPositions, board);
//             itemPositions.shift();
//             itemMap.set(item, itemPositions);
//         }
//     }

//     private clearOldPosition(itemPositions: Vec2[], board: BoardCell[][]) {
//         const pos1 = itemPositions[0];
//         const pos2 = itemPositions[1];
//         if (pos1 === pos2) {
//             return;
//         }
//         if (pos1.x !== -1 && pos1.y !== -1) {
//             board[pos1.x][pos1.y].item = ItemType.Default;
//         }
//     }
// }
