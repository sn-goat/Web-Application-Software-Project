import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { WaitingPageComponent } from './attente-page.component';

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CommonModule, FormsModule, WaitingPageComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should generate a 4-digit access code on initialization', () => {
        component.ngOnInit();
        expect(component.accessCode).toMatch(/^\d{4}$/);
    });

    it('should generate a new 4-digit access code', () => {
        component.generateAccessCode();
        expect(component.accessCode).toMatch(/^\d{4}$/);
    });

    it('should display the access code in the template', () => {
        component.generateAccessCode();
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.access-code')?.textContent).toBe(component.accessCode);
    });
});
