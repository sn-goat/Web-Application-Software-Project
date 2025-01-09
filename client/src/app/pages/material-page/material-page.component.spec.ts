import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { of } from 'rxjs';

export class MatDialogMock {
    open() {
        return {
            afterClosed: () => of({}),
        };
    }
}

describe('MaterialPageComponent', () => {
    let component: MaterialPageComponent;
    let fixture: ComponentFixture<MaterialPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MaterialPageComponent],
            providers: [{ provide: MatDialog, useClass: MatDialogMock }, provideAnimations()],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MaterialPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onLikeLoremTheme() should open a dialog', () => {
        // eslint-disable-next-line -- matDialog is private and we need access for the test
        const spy = spyOn(component['matDialog'], 'open');
        component.onLikeTheme();
        expect(spy).toHaveBeenCalled();
    });
});
