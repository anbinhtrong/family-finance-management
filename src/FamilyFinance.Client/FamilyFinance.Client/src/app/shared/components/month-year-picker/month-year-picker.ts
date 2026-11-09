import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MonthOption {
  month: number;
  shortName: string;
  fullName: string;
}

@Component({
  selector: 'app-month-year-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './month-year-picker.html',
  styleUrl: './month-year-picker.scss',
})
export class MonthYearPickerComponent {
  private readonly elementRef = inject(ElementRef);

  // Inputs & Two-way models using modern Angular signal APIs
  year = model<number>(new Date().getFullYear());
  month = model<number>(new Date().getMonth() + 1);
  ariaLabel = input<string>('Select month and year');
  variant = input<'inline' | 'input'>('inline'); // 'inline' for Dashboard header, 'input' for Form fields

  // Events
  changed = output<{ year: number; month: number }>();

  // Popover state
  isOpen = signal<boolean>(false);
  navigatingYear = signal<number>(new Date().getFullYear());

  readonly months: MonthOption[] = [
    { month: 1, shortName: 'Jan', fullName: 'January' },
    { month: 2, shortName: 'Feb', fullName: 'February' },
    { month: 3, shortName: 'Mar', fullName: 'March' },
    { month: 4, shortName: 'Apr', fullName: 'April' },
    { month: 5, shortName: 'May', fullName: 'May' },
    { month: 6, shortName: 'Jun', fullName: 'June' },
    { month: 7, shortName: 'Jul', fullName: 'July' },
    { month: 8, shortName: 'Aug', fullName: 'August' },
    { month: 9, shortName: 'Sep', fullName: 'September' },
    { month: 10, shortName: 'Oct', fullName: 'October' },
    { month: 11, shortName: 'Nov', fullName: 'November' },
    { month: 12, shortName: 'Dec', fullName: 'December' },
  ];

  selectedMonthLabel = computed(() => {
    const m = this.months.find((item) => item.month === this.month());
    return m ? `${m.fullName} ${this.year()}` : `${this.month()}/${this.year()}`;
  });

  togglePopover(): void {
    if (!this.isOpen()) {
      this.navigatingYear.set(this.year());
      this.isOpen.set(true);
    } else {
      this.isOpen.set(false);
    }
  }

  prevYear(): void {
    this.navigatingYear.update((y) => y - 1);
  }

  nextYear(): void {
    this.navigatingYear.update((y) => y + 1);
  }

  selectMonth(selectedMonthNumber: number): void {
    const selectedYearNumber = this.navigatingYear();
    this.year.set(selectedYearNumber);
    this.month.set(selectedMonthNumber);
    this.isOpen.set(false);
    this.changed.emit({ year: selectedYearNumber, month: selectedMonthNumber });
  }

  goToCurrentMonth(): void {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    this.navigatingYear.set(curYear);
    this.year.set(curYear);
    this.month.set(curMonth);
    this.isOpen.set(false);
    this.changed.emit({ year: curYear, month: curMonth });
  }

  isCurrentSelection(monthNumber: number): boolean {
    return this.year() === this.navigatingYear() && this.month() === monthNumber;
  }

  // Close when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
  }
}

