import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormVirtualPlayerComponent } from './form-virtual-player.component';

describe('FormVirtualPlayerComponent', () => {
    let component: FormVirtualPlayerComponent;
    let fixture: ComponentFixture<FormVirtualPlayerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormVirtualPlayerComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(FormVirtualPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
