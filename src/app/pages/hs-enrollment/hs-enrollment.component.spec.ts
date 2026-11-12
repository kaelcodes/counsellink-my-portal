import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HsEnrollmentComponent } from './hs-enrollment.component';

describe('HsEnrollmentComponent', () => {
  let component: HsEnrollmentComponent;
  let fixture: ComponentFixture<HsEnrollmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HsEnrollmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HsEnrollmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
