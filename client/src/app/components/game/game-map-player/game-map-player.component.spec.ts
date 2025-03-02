import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameMapPlayerComponent } from '@app/components/game/game-map-player/game-map-player.component';

describe('GameMapPlayerComponent', () => {
    let component: GameMapPlayerComponent;
    let fixture: ComponentFixture<GameMapPlayerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameMapPlayerComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
