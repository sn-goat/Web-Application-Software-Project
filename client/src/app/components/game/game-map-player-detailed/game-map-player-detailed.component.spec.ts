import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameMapPlayerDetailedComponent } from '@app/components/game/game-map-player-detailed/game-map-player-detailed.component';

describe('GameMapPlayerDetailedComponent', () => {
    let component: GameMapPlayerDetailedComponent;
    let fixture: ComponentFixture<GameMapPlayerDetailedComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameMapPlayerDetailedComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapPlayerDetailedComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
