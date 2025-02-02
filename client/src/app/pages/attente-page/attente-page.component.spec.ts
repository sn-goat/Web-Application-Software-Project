import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AttentePageComponent } from './attente-page.component';

describe('AttentePageComponent', () => {
    let component: AttentePageComponent;
    let fixture: ComponentFixture<AttentePageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CommonModule, FormsModule, AttentePageComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AttentePageComponent);
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
