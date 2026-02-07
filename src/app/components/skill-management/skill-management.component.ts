import { Component, AfterViewInit, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { SkillRepositoryService } from '../../services/skill-repository.service';
import { EmployeeRepositoryService } from "../../services/employee-repository.service";
import { Skill } from '../../model/Skill';

interface EnhancedSkill extends Skill {
  usageCount: number;
  isInEditMode?: boolean;
  editedName?: string;
}

@Component({
  selector: 'app-skill-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './skill-management.component.html',
  styleUrls: ['./skill-management.component.css']
})
export class SkillManagementComponent implements OnInit {
  @ViewChildren('inputField') inputFields!: QueryList<ElementRef>;

  enhancedSkillList$: Observable<EnhancedSkill[]>;
  skillNameInput = '';
  private filterTerm$ = new BehaviorSubject<string>('');

  constructor(
    private employeeRepo: EmployeeRepositoryService,
    private skillRepo: SkillRepositoryService
  ) {
    this.enhancedSkillList$ = this.buildSkillListObservable();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  private buildSkillListObservable(): Observable<EnhancedSkill[]> {
    return combineLatest([
      this.skillRepo.skills$,
      this.employeeRepo.getEmployees()
    ]).pipe(
      map(([skillList, employeeList]) => {
        return this.enrichSkillsWithUsage(skillList, employeeList);
      })
    );
  }

  private enrichSkillsWithUsage(skills: Skill[], employees: any[]): EnhancedSkill[] {
    return skills.map(skill => ({
      ...skill,
      usageCount: this.calculateUsageCount(skill, employees)
    }));
  }

  private calculateUsageCount(skill: Skill, employees: any[]): number {
    return employees.filter(emp =>
      emp.skillSet?.some((s: Skill) => s.id === skill.id)
    ).length;
  }

  private loadInitialData(): void {
    this.skillRepo.fetchSkills();
    this.employeeRepo.fetchEmployees();
  }

  createNewSkill(): void {
    const trimmedName = this.skillNameInput.trim();
    if (!trimmedName) {
      return;
    }

    this.skillRepo.createSkill(trimmedName).subscribe(() => {
      this.skillRepo.fetchSkills();
      this.skillNameInput = '';
    });
  }

  removeSkill(skill: EnhancedSkill): void {
    if (skill.id === undefined) {
      return;
    }

    if (skill.usageCount > 0 && !this.confirmDeletion(skill)) {
      return;
    }

    this.skillRepo.deleteSkill(skill.id).subscribe({
      next: () => this.refreshAllData(),
      error: (error) => console.error('Fehler beim Löschen:', error)
    });
  }

  private confirmDeletion(skill: EnhancedSkill): boolean {
    const message = `Der Skill "${skill.skill}" ist ${skill.usageCount} Mitarbeiter(n) zugewiesen. ` +
      `Möchten Sie ihn wirklich löschen? Dies entfernt den Skill von allen zugewiesenen Mitarbeitern.`;
    return confirm(message);
  }

  private refreshAllData(): void {
    this.employeeRepo.fetchEmployees();
    this.skillRepo.fetchSkills();
  }

  activateEditMode(skill: EnhancedSkill): void {
    this.saveAnyActiveEdits();

    skill.isInEditMode = true;
    skill.editedName = skill.skill;

    this.focusInputAfterRender(skill);
  }

  private saveAnyActiveEdits(): void {
    this.enhancedSkillList$.pipe(
      map(skills => skills.find(s => s.isInEditMode))
    ).subscribe(activeSkill => {
      if (activeSkill) {
        this.persistSkillChanges(activeSkill);
      }
    }).unsubscribe();
  }

  private focusInputAfterRender(skill: EnhancedSkill): void {
    setTimeout(() => {
      this.enhancedSkillList$.pipe(
        map(skills => skills.findIndex(s => s.id === skill.id))
      ).subscribe(position => {
        if (position >= 0) {
          const inputElement = this.inputFields.toArray()[position];
          inputElement?.nativeElement.focus();
        }
      });
    }, 0);
  }

  persistSkillChanges(skill: EnhancedSkill): void {
    if (skill.id === undefined || !skill.editedName) {
      return;
    }

    const updatedSkillData: Skill = {
      id: skill.id,
      skill: skill.editedName
    };

    this.skillRepo.updateSkill(updatedSkillData).subscribe(() => {
      this.skillRepo.fetchSkills();
      skill.isInEditMode = false;
    });
  }
}
