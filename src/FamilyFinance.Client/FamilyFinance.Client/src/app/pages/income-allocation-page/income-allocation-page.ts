import { Component, inject, signal, computed } from '@angular/core';
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
  private allocationService = inject(IncomeAllocationService);
  private initialPlan = this.allocationService.plan();

  // Signals
  selectedMonth = signal(this.initialPlan.month);
  selectedYear = signal(this.initialPlan.year);
  monthlyIncome = signal<number>(this.initialPlan.totalIncome);
  jars = signal<JarAllocationItem[]>(structuredClone(this.initialPlan.jars));

  // Computed signals
  totalAllocated = computed(() =>
    this.jars().reduce((acc, jar) => acc + (Number(jar.allocatedAmount) || 0), 0)
  );

  remainingAmount = computed(() =>
    (Number(this.monthlyIncome()) || 0) - this.totalAllocated()
  );

  isValid = computed(() => {
    const income = Number(this.monthlyIncome()) || 0;
    return income > 0 && this.remainingAmount() === 0;
  });

  allocationPercentage = computed(() => {
    const income = Number(this.monthlyIncome()) || 0;
    if (income <= 0) return 0;
    return Math.round((this.totalAllocated() / income) * 100);
  });

  // Actions
  updateIncome(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value) || 0;
    this.monthlyIncome.set(val);
  }

  updateJarAmount(jar: JarAllocationItem, event: Event): void {
    const val = Number((event.target as HTMLInputElement).value) || 0;
    jar.allocatedAmount = val;
    this.jars.update((list) => [...list]);
  }

  recalculateByRate(): void {
    const income = Number(this.monthlyIncome()) || 0;
    this.jars.update((list) =>
      list.map((jar) => ({
        ...jar,
        allocatedAmount: Math.round((income * jar.defaultRate) / 100),
      }))
    );
  }

  onSave(): void {
    if (!this.isValid()) return;

    this.allocationService.saveAllocation({
      month: this.selectedMonth(),
      year: this.selectedYear(),
      totalIncome: this.monthlyIncome(),
      jars: this.jars(),
    });
    alert('Xác nhận phân bổ thu nhập 7 hũ thành công!');
  }
}
