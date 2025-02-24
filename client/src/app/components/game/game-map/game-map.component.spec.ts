import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameMapComponent } from '@app/components/game/game-map/game-map.component';

describe('GameMapComponent', () => {
    let component: GameMapComponent;
    let fixture: ComponentFixture<GameMapComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameMapComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
