import { Component, Input } from '@angular/core';
import { BoardCell } from '@app/interfaces/board/board-cell';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-board-cell',
    templateUrl: './board-cell.component.html',
    styleUrls: ['./board-cell.component.scss'],
    imports: [CommonModule],
})
export class BoardCellComponent {
    @Input() cell!: BoardCell;

    // onHover() {
    // }

    // onLeftClick() {
    // }

    // onRightClick(event: MouseEvent) {
    // }
}
