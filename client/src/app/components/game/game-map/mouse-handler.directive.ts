import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Cell } from '@common/board';

@Directive({
    selector: '[appMouseHandler]',
})
export class MouseHandlerDirective {
    @Input('appMouseHandler') cell: Cell;
    @Input() disable: boolean = false;
    @Output() cellClicked = new EventEmitter<Cell>();

    @HostListener('click', ['$event'])
    onClick(): void {
        if (this.disable) {
            return;
        }
        this.cellClicked.emit(this.cell);
    }
}
