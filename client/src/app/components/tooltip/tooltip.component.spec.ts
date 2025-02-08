import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TooltipComponent } from './tooltip.component';

describe('TooltipComponent', () => {
    let component: TooltipComponent;
    let fixture: ComponentFixture<TooltipComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TooltipComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TooltipComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display the input text', () => {
        const testText = 'Test tooltip text';
        component.text = testText;
        fixture.detectChanges();

        const tooltipElement = fixture.debugElement.query(By.css('.tooltip')).nativeElement;
        expect(tooltipElement.textContent).toContain(testText);
    });
});
