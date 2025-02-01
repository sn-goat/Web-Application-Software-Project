import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapMakerComponent } from './map-maker.component';

describe('MapMakerComponent', () => {
    let component: MapMakerComponent;
    let fixture: ComponentFixture<MapMakerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MapMakerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(MapMakerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
