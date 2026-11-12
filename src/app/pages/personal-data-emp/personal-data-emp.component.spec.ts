import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalDataEmpComponent } from './personal-data-emp.component';

describe('PersonalDataEmpComponent', () => {
  let component: PersonalDataEmpComponent;
  let fixture: ComponentFixture<PersonalDataEmpComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PersonalDataEmpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonalDataEmpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
