import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Cell } from '@common/board';

@Directive({
    selector: '[appMouseHandler]',
})
export class MouseHandlerDirective {
    @Input('appMouseHandler') cell: Cell;
    @Output() leftClicked = new EventEmitter<Cell>();
    @Output() rightClicked = new EventEmitter<Cell>();

    @HostListener('mousedown', ['$event'])
    onClick(event: MouseEvent): void {
        if (event.button === 0) {
            this.leftClicked.emit(this.cell);
        } else if (event.button === 2) {
            this.rightClicked.emit(this.cell);
        }
    }

    @HostListener('contextmenu', ['$event'])
    onRightClick(event: MouseEvent): void {
        event.preventDefault();
    }
}
