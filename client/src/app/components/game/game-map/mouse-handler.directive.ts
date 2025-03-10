import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Cell } from '@common/board';

@Directive({
    selector: '[appMouseHandler]',
})
export class MouseHandlerDirective {
    // Pass the cell object into the directive via the attribute binding.
    @Input('appMouseHandler') cell: Cell;
    // Emit the cell when clicked.
    @Output() cellClicked = new EventEmitter<Cell>();

    @HostListener('click', ['$event'])
    onClick(): void {
        // Emit the cell without logging—let the component decide what to do.
        this.cellClicked.emit(this.cell);
        // eslint-disable-next-line no-console
        // console.log('Cell clicked:', this.cell, event);
    }
}
