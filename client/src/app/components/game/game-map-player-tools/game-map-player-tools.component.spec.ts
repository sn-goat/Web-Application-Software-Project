import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameMapPlayerToolsComponent } from '@app/components/game/game-map-player-tools/game-map-player-tools.component';

describe('GameMapPlayerToolsComponent', () => {
    let component: GameMapPlayerToolsComponent;
    let fixture: ComponentFixture<GameMapPlayerToolsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameMapPlayerToolsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapPlayerToolsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
