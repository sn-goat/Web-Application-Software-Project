import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { HeaderBarComponent } from './header-bar.component';

describe('HeaderBarComponent', () => {
    let component: HeaderBarComponent;
    let fixture: ComponentFixture<HeaderBarComponent>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            imports: [HeaderBarComponent, MatIconModule, MatButtonModule, MatToolbarModule],
            providers: [{ provide: Router, useValue: routerSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(HeaderBarComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to backUrl when getBack is called', () => {
        component.backUrl = 'home';
        component.getBack();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });
});
