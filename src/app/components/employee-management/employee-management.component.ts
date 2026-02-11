import {Component, OnInit, computed, signal, WritableSignal, Signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { RepositoryService } from '../../services/repository.service';
import { Employee } from '../../models/employee';
import { Skill } from '../../models/skill';
import {Chip} from "primeng/chip";

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, TableModule, InputTextModule, ButtonModule, DialogModule, MultiSelectModule, FormsModule, Chip],
  templateUrl: './employee-management.component.html',
  styleUrl: './employee-management.component.css'
})
export class EmployeeManagementComponent implements OnInit {
  globalFilter: WritableSignal<string> = signal('');
  dialogVisible: WritableSignal<boolean> = signal(false);
  editMode: WritableSignal<boolean> = signal(false); // true when editing, false when creating
  private _editEmployee = signal<Employee>({} as Employee);
  editEmployee = () => this._editEmployee();
  editSkillIdsProxy: number[] = [];

  employees: Signal<Employee[]>;
  skills: Signal<Skill[]>;

  employeesView = computed(() => {
    const term = (this.globalFilter() || '').trim().toLowerCase();
    const list = this.employees();
    if (!term) return list;
    return list.filter(e =>
      `${e.firstName ?? ''} ${e.lastName ?? ''} ${e.city ?? ''} ${e.street ?? ''}`.toLowerCase().includes(term)
    );
  });

  constructor(private repo: RepositoryService) {
    this.employees = this.repo.employeesSignal;
    this.skills = this.repo.skillsSignal;
  }

  async ngOnInit(): Promise<void> {
    await this.repo.loadAll();
  }

  skillOptions() { return this.skills(); }

  openCreate() {
    this._editEmployee.set({} as Employee);
    this.editSkillIdsProxy = [];
    this.editMode.set(false);
    this.dialogVisible.set(true);
  }

  openEdit(e: Employee) {
    const clone: Employee = { ...e, skillSet: e.skillSet ? e.skillSet.map(s => ({ ...s })) : [] };
    this._editEmployee.set(clone);
    this.editSkillIdsProxy = clone.skillSet?.map(s => s.id!) ?? [];
    this.editMode.set(true);
    this.dialogVisible.set(true);
  }

  closeDialog() { this.dialogVisible.set(false); }

  async save() {
    const emp = { ...this.editEmployee() } as Employee;
    const allSkills = this.skills();
    emp.skillSet = (this.editSkillIdsProxy || []).map(id => {
      const s = allSkills.find(x => x.id === id);
      return s ? { ...s } : { id, skill: '' };
    });

    try {
      if (this.editMode()) {
        await this.repo.updateEmployee(emp);
      } else {
        await this.repo.createEmployee(emp);
      }
      this.dialogVisible.set(false);
    } catch (err) {
      console.error('save employee failed', err);
    }
  }

  async deleteEmployee(id?: number) {
    if (!id) return;
    if (!confirm('Delete employee?')) return;
    try { await this.repo.deleteEmployee(id); } catch (err) { console.error(err); }
  }
}
