import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

import { Employee } from '../../model/Employee';
//TODO: Skills import
import { Skill } from '../../model/Skill';
import { employeeRepositoryService } from "../employee-db/employeeRepository.service";

@Component({
  selector: 'app-employee-inspector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-inspector.component.html',
  styleUrl: './employee-inspector.component.css'
})
export class EmployeeInspectorComponent implements OnInit {

  employee: Employee = new Employee();
  isEditing = false;

  allSkills: Skill[] = [];
  availableSkills: Skill[] = [];

  searchText = '';
  dropdownSkills: Skill[] = [];
  allowCreate = false;

  errorMessage: string | null = null;

  @ViewChild('employeeForm') employeeForm!: NgForm;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private db: employeeRepositoryService
  ) {}

  ngOnInit(): void {
    this.initializeEmployee();
    this.initializeSkills();
  }


  // init

  private initializeEmployee(): void {
    this.route.queryParamMap.subscribe(params => {
      const id = Number(params.get('id'));

      if (id && !isNaN(id)) {
        this.loadEmployee(id);
      } else {
        this.prepareNewEmployee();
      }
    });
  }

  private initializeSkills(): void {
    //TODO Skills
    this.db.skills$.subscribe(skills => {
      this.allSkills = skills;
      this.refreshAvailableSkills();
      this.updateDropdown();
    });

    this.db.fetchQualifications();
  }

  private loadEmployee(id: number): void {
    this.db.getEmployee(id).subscribe(emp => {
      this.employee = emp;
      this.employee.skillSet ??= [];
      this.refreshAvailableSkills();
      this.updateDropdown();
    });
  }

  private prepareNewEmployee(): void {
    this.employee = new Employee();
    this.employee.skillSet = [];
    this.isEditing = true;
  }


  toggleEditMode(): void {
    this.errorMessage = null;

    if (!this.isEditing) {
      this.isEditing = true;
      return;
    }

    if (this.employeeForm?.invalid) {
      this.employeeForm.form.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.employee.id
      ? this.updateEmployee()
      : this.createEmployee();
  }

  private updateEmployee(): void {
    this.db.updateEmployee(this.employee).subscribe({
      next: () => (this.isEditing = false),
      error: err => this.handleError(err, 'Failed to update employee')
    });
  }

  private createEmployee(): void {
    this.db.createEmployee(this.employee).subscribe({
      next: emp => {
        this.employee = emp;
        this.isEditing = false;
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { id: emp.id },
          queryParamsHandling: 'merge'
        });
      },
      error: err => this.handleError(err, 'Failed to create employee')
    });
  }


  onSearchChange(): void {
    this.updateDropdown();
  }

  onSearchEnter(event: Event): void {
    event.preventDefault();

    if (this.allowCreate) {
      this.createSkill();
      return;
    }

    const first = this.dropdownSkills[0];
    if (first?.id) {
      this.assignSkill(first.id);
    }
  }

  private updateDropdown(): void {
    if (!this.searchText) {
      this.dropdownSkills = [...this.availableSkills];
      this.allowCreate = false;
      return;
    }

    const value = this.searchText.toLowerCase();

    this.dropdownSkills = this.availableSkills.filter(
      s => s.skill?.toLowerCase().includes(value)
    );

    const exact = this.allSkills.some(
      s => s.skill?.toLowerCase() === value
    );

    this.allowCreate = !exact && value.length > 0;
  }

  private refreshAvailableSkills(): void {
    const assigned = new Set(this.employee.skillSet?.map(s => s.id));
    this.availableSkills = this.allSkills.filter(s => !assigned.has(s.id));
  }

  assignSkill(skillId: number): void {
    if (!this.employee.id) return;

    const skill = this.allSkills.find(s => s.id === skillId);
    if (!skill?.skill) return;

    // TODO Skills hinzufügen für EmployeeId
    this.db.addQualificationToEmployee(this.employee.id, skill.skill).subscribe(() => {
      this.reloadEmployeeSkills();
    });

    this.searchText = '';
  }

  createSkill(): void {
    if (!this.searchText || !this.employee.id) return;

    //TODO Skills createSkill / fetchQualifications
    this.db.createSkill(this.searchText).subscribe(newSkill => {
      this.db.fetchQualifications();
      this.assignSkill(newSkill.id!);
      this.searchText = '';
    });
  }

  removeSkill(skillId?: number): void {
    if (!this.employee.id || !skillId) return;

    //TODO Skills removeSkill
    this.db.deleteQualificationFromEmployee(this.employee.id, skillId).subscribe(() => {
      this.reloadEmployeeSkills();
      this.db.fetchEmployees();
    });
  }

  private reloadEmployeeSkills(): void {
    if (!this.employee.id) return;

    //TODO Skills getSkills für EmployeeId
    this.db.getEmployeeQualifications(this.employee.id).subscribe(skills => {
      this.employee.skillSet = skills;
      this.refreshAvailableSkills();
      this.updateDropdown();
    });
  }


  private handleError(err: any, fallback: string): void {
    console.error(err);
    this.errorMessage = err?.error?.message || fallback;
  }


  deleteSkill(skillId?: number): void {
    this.removeSkill(skillId);
  }

  addSkill(skillId: number | undefined): void {
    if (skillId) {
      this.assignSkill(skillId);
    }
  }

  createNewSkill(): void {
    this.createSkill();
  }

  filterSkillsForDropdown(): void {
    this.updateDropdown();
  }

  handleSkillSearchEnter(event: Event): void {
    this.onSearchEnter(event);
  }

  get skillSearchText(): string {
    return this.searchText;
  }

  set skillSearchText(value: string) {
    this.searchText = value;
    this.updateDropdown();
  }

  get showCreateSkill(): boolean {
    return this.allowCreate;
  }

}


