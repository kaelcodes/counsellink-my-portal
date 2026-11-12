import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HsEnrollmentFamilyBackgroundFamilymemberComponent } from './hs-enrollment-family-background-familymember.component';

describe('HsEnrollmentFamilyBackgroundFamilymemberComponent', () => {
  let component: HsEnrollmentFamilyBackgroundFamilymemberComponent;
  let fixture: ComponentFixture<HsEnrollmentFamilyBackgroundFamilymemberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HsEnrollmentFamilyBackgroundFamilymemberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HsEnrollmentFamilyBackgroundFamilymemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
