import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Cell } from '@common/board';
import { MouseHandlerDirective } from './mouse-handler.directive';

// Define the TestHostComponent as a standalone component and import the directive.
@Component({
    standalone: true,
    imports: [MouseHandlerDirective],
    template: ' <div [appMouseHandler]="testCell" (leftClicked)="handleLeftClick($event)" (rightClicked)="handleRightClick($event)"></div> ',
})
class TestHostComponent {
    // Provide a dummy Cell (ensure you include any required properties)
    testCell: Cell = { id: 1 } as unknown as Cell;
    leftClickResult: Cell | null = null;
    rightClickResult: Cell | null = null;

    handleLeftClick(cell: Cell): void {
        this.leftClickResult = cell;
    }
    handleRightClick(cell: Cell): void {
        this.rightClickResult = cell;
    }
}

describe('MouseHandlerDirective', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let component: TestHostComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            // Import the standalone TestHostComponent, which already imports MouseHandlerDirective.
            imports: [TestHostComponent],
        });
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should emit leftClicked event on left mouse click', () => {
        const debugEl = fixture.debugElement.query(By.directive(MouseHandlerDirective));
        expect(debugEl).toBeTruthy('Directive should be found');
        // Simulate a left click (button: 0)
        debugEl.triggerEventHandler('mousedown', { button: 0 });
        fixture.detectChanges();
        expect(component.leftClickResult).toEqual(component.testCell);
    });

    it('should emit rightClicked event on right mouse click', () => {
        const debugEl = fixture.debugElement.query(By.directive(MouseHandlerDirective));
        expect(debugEl).toBeTruthy('Directive should be found');
        // Simulate a right click (button: 2)
        debugEl.triggerEventHandler('mousedown', { button: 2 });
        fixture.detectChanges();
        expect(component.rightClickResult).toEqual(component.testCell);
    });

    it('should prevent default behavior on contextmenu event', () => {
        const debugEl = fixture.debugElement.query(By.directive(MouseHandlerDirective));
        expect(debugEl).toBeTruthy('Directive should be found');
        const event = new MouseEvent('contextmenu');
        spyOn(event, 'preventDefault');
        debugEl.triggerEventHandler('contextmenu', event);
        expect(event.preventDefault).toHaveBeenCalled();
    });
});
