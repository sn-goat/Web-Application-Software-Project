import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Routes, provideRouter } from '@angular/router';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { CommunicationService } from '@app/services/communication.service';
import SpyObj = jasmine.SpyObj;

const routes: Routes = [];

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let communicationServiceSpy: SpyObj<CommunicationService>;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('ExampleService', ['basicGet', 'basicPost']);
        await TestBed.configureTestingModule({
            imports: [MainPageComponent],
            providers: [
                {
                    provide: CommunicationService,
                    useValue: communicationServiceSpy,
                },
                provideHttpClientTesting(),
                provideRouter(routes),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it("should have as title 'POLYTOPIA'", () => {
        expect(component.title).toEqual('POLYTOPIA');
    });

    it('should have a game logo path valid', () => {
        expect(component.gameLogoPath).toEqual('/assets/POLYTOPIA_game_logo.png');
    });

    it('should load the game logo proprely', () => {
        expect(component.gameLogoError).toBeFalsy();
    });

    it('gameLogoError should be true if there is an error when loading the logo', () => {
        component.handleGameLogoError();
        expect(component.gameLogoError).toBeTruthy();
    });
});
