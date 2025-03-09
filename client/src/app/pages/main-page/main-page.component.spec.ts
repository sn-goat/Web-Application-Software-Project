import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink, Routes } from '@angular/router';
import { TEAM_MEMBERS } from '@app/constants/team-members';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';

const routes: Routes = [];

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MainPageComponent, RouterLink],
            providers: [provideHttpClientTesting(), provideRouter(routes)],
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

    it('should initialize with correct title', () => {
        expect(component.title).toBe('POLYTOPIA');
    });

    it('should initialize with correct team members', () => {
        expect(component.teamMembers).toEqual(TEAM_MEMBERS);
    });

    it('should initialize with correct game logo path', () => {
        expect(component.gameLogoPath).toContain('/assets/POLYTOPIA_game_logo.png');
    });

    it('should initialize with gameLogoError as false', () => {
        expect(component.gameLogoError).toBeFalse();
    });

    it('should set gameLogoError to true when handleGameLogoError is called', () => {
        expect(component.gameLogoError).toBeFalse();
        component.handleGameLogoError();
        expect(component.gameLogoError).toBeTrue();
    });

    it('should trigger handleGameLogoError when image error occurs', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const img = compiled.querySelector('img');
        expect(component.gameLogoError).toBeFalse();
        img?.dispatchEvent(new Event('error'));
        fixture.detectChanges();
        expect(component.gameLogoError).toBeTrue();
    });

    it('should contain RouterLink in the imports', () => {
        const componentDecorator = Reflect.getOwnPropertyDescriptor(MainPageComponent, '__annotations__')?.value[0];
        expect(componentDecorator.imports).toContain(RouterLink);
    });

    it('should render title in the template', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.textContent).toContain('POLYTOPIA');
    });

    it('should render game logo with correct src', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const img = compiled.querySelector('img');
        expect(img?.src).toContain('/assets/POLYTOPIA_game_logo.png');
    });

    it('should render team members list', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        TEAM_MEMBERS.forEach((member) => {
            expect(compiled.textContent).toContain(member);
        });
    });
});
