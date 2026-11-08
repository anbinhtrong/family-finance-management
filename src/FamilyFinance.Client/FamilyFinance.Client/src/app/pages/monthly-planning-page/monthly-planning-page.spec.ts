import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonthlyPlanningPage } from './monthly-planning-page';

describe('MonthlyPlanningPage', () => {
  let component: MonthlyPlanningPage;
  let fixture: ComponentFixture<MonthlyPlanningPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyPlanningPage],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthlyPlanningPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
