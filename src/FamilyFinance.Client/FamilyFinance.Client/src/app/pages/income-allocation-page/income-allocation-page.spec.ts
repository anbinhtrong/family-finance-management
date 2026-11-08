import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IncomeAllocationPage } from './income-allocation-page';

describe('IncomeAllocationPage', () => {
  let component: IncomeAllocationPage;
  let fixture: ComponentFixture<IncomeAllocationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomeAllocationPage],
    }).compileComponents();

    fixture = TestBed.createComponent(IncomeAllocationPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
