import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationPickComponent } from './application-pick.component';

describe('ApplicationPickComponent', () => {
  let component: ApplicationPickComponent;
  let fixture: ComponentFixture<ApplicationPickComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApplicationPickComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationPickComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
