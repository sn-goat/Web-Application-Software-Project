import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameFightInterfaceComponent } from '@app/components/game/game-fight-interface/game-fight-interface.component';

describe('GameFightInterfaceComponent', () => {
    let component: GameFightInterfaceComponent;
    let fixture: ComponentFixture<GameFightInterfaceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameFightInterfaceComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GameFightInterfaceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
