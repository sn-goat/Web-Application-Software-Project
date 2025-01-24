import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditToolItemComponent } from './edit-tool-item.component';

describe('EditToolItemComponent', () => {
  let component: EditToolItemComponent;
  let fixture: ComponentFixture<EditToolItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditToolItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditToolItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
