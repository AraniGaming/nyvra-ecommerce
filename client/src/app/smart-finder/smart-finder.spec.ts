import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartFinderComponent } from './smart-finder';

describe('SmartFinderComponent', () => {
  let component: SmartFinderComponent;
  let fixture: ComponentFixture<SmartFinderComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartFinderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SmartFinderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
