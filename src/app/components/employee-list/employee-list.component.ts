import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { Employee } from '../../model/Employee';
import {employeeRepositoryService} from "../employee-db/employeeRepository.service";

type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.css'
})
export class EmployeeListComponent {

  activeColumn = 'lastName';
  direction: 'asc' | 'desc' = 'asc';

  employeesView$!: Observable<Employee[]>;

  constructor(
    private router: Router,
    protected db: employeeRepositoryService
  ) {
    this.employeesView$ = this.buildEmployeesStream();
  }

  changeSorting(column: string): void {
    if (this.activeColumn === column) {
      this.direction = this.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.activeColumn = column;
      this.direction = 'asc';
    }

    this.employeesView$ = this.buildEmployeesStream();
  }

  private buildEmployeesStream(): Observable<Employee[]> {
    return combineLatest([
      this.db.employees$,
      //TODO Skills selectedSkillIds$
      this.db.selectedSkillIds$
    ]).pipe(
      map(([employees = [], selectedSkills]) => {
        const visible = this.applySkillFilter(employees, selectedSkills);
        return this.sortEmployees(visible);
      })
    );
  }

  private applySkillFilter(list: Employee[], skills: number[]): Employee[] {
    if (!skills.length) {
      return list;
    }

    return list.filter(emp => {
      const ids = emp.skillSet?.map(s => s.id) ?? [];
      return skills.every(id => ids.includes(id));
    });
  }

  private sortEmployees(list: Employee[]): Employee[] {
    const extractor = this.valueExtractor(this.activeColumn);

    return [...list].sort((a, b) => {
      const aVal = extractor(a);
      const bVal = extractor(b);

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return this.direction === 'asc' ? result : -result;
    });
  }

  private valueExtractor(column: string): (e: Employee) => string | number | undefined {
    const map: Record<string, (e: Employee) => string | number | undefined> = {
      lastName: e => `${e.lastName}, ${e.firstName}`.toLowerCase(),
      phone: e => e.phone?.toLowerCase()
    };

    return map[column] ?? ((e: any) => e[column]);
  }

  getSortIcon(column: string): string {
    if (this.activeColumn !== column) {
      return 'bi-arrow-down-up';
    }
    return this.direction === 'asc'
      ? 'bi-sort-alpha-down'
      : 'bi-sort-alpha-up';
  }

  addEmployee(): void {
    this.router.navigate(['/inspector']);
  }

  removeEmployee(id?: number): void {
    this.db.deleteEmployee(id);
  }

  openInspector(id?: number): void {
    this.router.navigate(['/inspector'], {
      queryParams: { id }
    });
  }

  confirmRemoveEmployee(emp: Employee): void {
    const fullName = `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();

    const confirmed = window.confirm(
      `Are you sure you want to remove "${fullName}"?`
    );

    if (confirmed) {
      this.removeEmployee(emp.id);
    }
  }

}
