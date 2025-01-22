import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditToolComponent } from './edit-tool.component';

describe('EditToolComponent', () => {
  let component: EditToolComponent;
  let fixture: ComponentFixture<EditToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
