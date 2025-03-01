import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameMapInfoComponent } from '@app/components/game/game-map-info/game-map-info.component';

describe('GameMapInfoComponent', () => {
    let component: GameMapInfoComponent;
    let fixture: ComponentFixture<GameMapInfoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameMapInfoComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
