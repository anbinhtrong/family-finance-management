import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonthYearPickerComponent } from './month-year-picker';

describe('MonthYearPickerComponent', () => {
  let fixture: ComponentFixture<MonthYearPickerComponent>;
  let component: MonthYearPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthYearPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthYearPickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('year', 2026);
    fixture.componentRef.setInput('month', 11);
    fixture.detectChanges();
  });

  it('should create and render initial label', () => {
    expect(component).toBeTruthy();
    expect(component.selectedMonthLabel()).toBe('November 2026');
  });

  it('should toggle popover on trigger button click', () => {
    expect(component.isOpen()).toBe(false);
    const trigger = fixture.nativeElement.querySelector('.picker-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(fixture.nativeElement.querySelector('.picker-popover')).toBeTruthy();

    trigger.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(false);
  });

  it('should navigate years inside popover', () => {
    component.isOpen.set(true);
    component.navigatingYear.set(2026);
    fixture.detectChanges();

    component.nextYear();
    expect(component.navigatingYear()).toBe(2027);

    component.prevYear();
    expect(component.navigatingYear()).toBe(2026);
  });

  it('should select a month and emit changed event', () => {
    let emitted: { year: number; month: number } | null = null;
    component.changed.subscribe((val) => (emitted = val));

    component.isOpen.set(true);
    component.navigatingYear.set(2026);
    fixture.detectChanges();

    // Click May (index 5)
    component.selectMonth(5);
    fixture.detectChanges();

    expect(component.year()).toBe(2026);
    expect(component.month()).toBe(5);
    expect(component.isOpen()).toBe(false);
    expect(emitted).toEqual({ year: 2026, month: 5 });
  });
});

