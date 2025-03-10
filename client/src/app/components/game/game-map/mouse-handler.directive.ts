import { Directive, HostListener, Input } from '@angular/core';
import { Cell } from '@common/board';

@Directive({
  selector: '[appMouseHandler]'
})
export class MouseHandlerDirective {
  
  // Bind the cell object to the directive
  @Input('appMouseHandler') cell: Cell;

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    console.log('Clicked cell:', this.cell);
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent): void {
    event.preventDefault(); // Prevent default context menu
    console.log('Right click on cell:', this.cell);
  }

//   @HostListener('mousedown', ['$event'])
//   onMouseDown(event: MouseEvent): void {
//     console.log('Mouse down:', event);
//   }

//   @HostListener('mouseup', ['$event'])
//   onMouseUp(event: MouseEvent): void {
//     console.log('Mouse up:', event);
//   }

//   @HostListener('drag', ['$event'])
//   onDrag(event: DragEvent): void {
//     console.log('Dragging:', event);
//   }
}
