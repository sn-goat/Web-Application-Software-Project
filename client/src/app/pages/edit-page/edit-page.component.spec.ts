import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { EditPageComponent } from './edit-page.component';

describe('EditPageComponent', () => {
    let component: EditPageComponent;
    let fixture: ComponentFixture<EditPageComponent>;

    const queryParamsSubject = new BehaviorSubject({
        name: 'Test Name',
        size: '20',
        description: 'Test Description',
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditPageComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParams: queryParamsSubject.asObservable(),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EditPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
