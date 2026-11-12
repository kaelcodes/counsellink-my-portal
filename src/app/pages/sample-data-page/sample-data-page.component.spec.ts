import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleDataPageComponent } from './sample-data-page.component';

describe('SampleDataPageComponent', () => {
  let component: SampleDataPageComponent;
  let fixture: ComponentFixture<SampleDataPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SampleDataPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SampleDataPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
