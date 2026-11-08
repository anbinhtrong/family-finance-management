import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IncomeAllocationService } from '../../features/income-allocation/services/income-allocation.service';
import { JarAllocationItem } from '../../features/income-allocation/models/income-allocation.model';

@Component({
  selector: 'app-income-allocation-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './income-allocation-page.html',
  styleUrl: './income-allocation-page.scss',
})
export class IncomeAllocationPage {
  private readonly allocationService = inject(IncomeAllocationService);
  private readonly initialSession = this.allocationService.session();

  // Signals
  selectedMonth = signal<number>(this.initialSession.month);
  selectedYear = signal<number>(this.initialSession.year);
  totalIncome = signal<number>(this.initialSession.totalIncome);
  jars = signal<JarAllocationItem[]>(structuredClone(this.initialSession.jars));
  isConfirmed = signal<boolean>(this.initialSession.isConfirmed);

  // Computed signals
  totalAllocated = computed(() =>
    this.jars().reduce((sum, jar) => sum + (Number(jar.allocatedAmount) || 0), 0)
  );

  remainingAmount = computed(() =>
    (Number(this.totalIncome()) || 0) - this.totalAllocated()
  );

  noNegativeValues = computed(() =>
    this.jars().every((jar) => (Number(jar.allocatedAmount) || 0) >= 0)
  );

  isValid = computed(() => {
    const income = Number(this.totalIncome()) || 0;
    return income > 0 && this.remainingAmount() === 0 && this.noNegativeValues();
  });

  allocationPercentage = computed(() => {
    const income = Number(this.totalIncome()) || 0;
    if (income <= 0) return 0;
    return Math.round((this.totalAllocated() / income) * 100);
  });

  // Reactive handlers
  onTotalIncomeChange(event: Event): void {
    const value = Math.max(0, Number((event.target as HTMLInputElement).value) || 0);
    this.totalIncome.set(value);
    this.isConfirmed.set(false);
  }

  onJarAmountChange(jar: JarAllocationItem, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value) || 0;
    jar.allocatedAmount = value;
    this.jars.update((list) => [...list]);
    this.isConfirmed.set(false);
  }

  autoAllocate(): void {
    const income = Number(this.totalIncome()) || 0;
    const reallocatedJars = this.allocationService.calculateInitialAllocations(income);
    this.jars.set(reallocatedJars);
    this.isConfirmed.set(false);
  }

  onConfirm(): void {
    if (!this.isValid()) return;

    this.allocationService.saveAllocation({
      month: this.selectedMonth(),
      year: this.selectedYear(),
      totalIncome: this.totalIncome(),
      isConfirmed: true,
      jars: this.jars(),
    });

    this.isConfirmed.set(true);
  }
}
