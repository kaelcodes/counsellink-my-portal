import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HsEnrollmentFamilyBackgroundGuardianComponent } from './hs-enrollment-family-background-guardian.component';

describe('HsEnrollmentFamilyBackgroundGuardianComponent', () => {
  let component: HsEnrollmentFamilyBackgroundGuardianComponent;
  let fixture: ComponentFixture<HsEnrollmentFamilyBackgroundGuardianComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HsEnrollmentFamilyBackgroundGuardianComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HsEnrollmentFamilyBackgroundGuardianComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
