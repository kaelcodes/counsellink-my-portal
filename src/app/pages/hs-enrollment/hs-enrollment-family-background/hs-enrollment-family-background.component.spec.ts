import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HsEnrollmentFamilyBackgroundComponent } from './hs-enrollment-family-background.component';

describe('HsEnrollmentFamilyBackgroundComponent', () => {
  let component: HsEnrollmentFamilyBackgroundComponent;
  let fixture: ComponentFixture<HsEnrollmentFamilyBackgroundComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HsEnrollmentFamilyBackgroundComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HsEnrollmentFamilyBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
