/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { AlertComponent } from '@app/components/common/alert/alert.component';
import { Alert } from '@app/constants/enums';
import { of } from 'rxjs';
import { HeaderBarComponent } from './header-bar.component';

describe('HeaderBarComponent', () => {
    let component: HeaderBarComponent;
    let fixture: ComponentFixture<HeaderBarComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null });

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        dialogSpy.open.and.returnValue(dialogRefSpyObj);

        TestBed.configureTestingModule({
            imports: [HeaderBarComponent, MatIconModule, MatButtonModule, MatToolbarModule, MatDialogModule],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: MatDialog, useValue: dialogSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(HeaderBarComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to backUrl when getBack is called', () => {
        component.backUrl = 'home';
        component.showDialog = false; // S'assurer que le dialog n'est pas affiché
        component.getBack();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/accueil']);
    });

    // Test pour les lignes 27-29 : Dialogue avec confirmation
    it('should show dialog and navigate when confirmed', async () => {
        component.backUrl = 'admin';
        component.showDialog = true;
        component.message = 'Test message';
        dialogRefSpyObj.afterClosed.and.returnValue(of(true));

        await component.getBack();

        expect(dialogSpy.open).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
    });

    // Test pour les lignes 27-29 : Dialogue sans confirmation
    it('should show dialog and not navigate when cancelled', async () => {
        component.backUrl = 'admin';
        component.showDialog = true;
        dialogRefSpyObj.afterClosed.and.returnValue(of(false));

        await component.getBack();

        expect(dialogSpy.open).toHaveBeenCalled();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    // Test pour les lignes 37-44 : Méthode openDialog
    it('should return dialog result from openDialog', async () => {
        // Test avec résultat positif
        dialogRefSpyObj.afterClosed.and.returnValue(of(true));

        const result = await (component as any).openDialog('Test message', Alert.CONFIRM);

        expect(dialogSpy.open).toHaveBeenCalledWith(AlertComponent, {
            data: { type: Alert.CONFIRM, message: 'Test message' },
            disableClose: true,
            hasBackdrop: true,
            backdropClass: 'backdrop-block',
            panelClass: 'alert-dialog',
        });
        expect(result).toBeTrue();
    });
});
