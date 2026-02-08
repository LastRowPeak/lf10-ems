import {Component, OnInit, computed, signal, WritableSignal, Signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { RepositoryService } from '../../services/repository.service';
import { Skill } from '../../models/skill';
import {Employee} from "../../models/employee";

@Component({
  selector: 'app-skill-management',
  standalone: true,
  imports: [CommonModule, TableModule, InputTextModule, ButtonModule, DialogModule, FormsModule],
  templateUrl: './skill-management.component.html',
  styleUrl: './skill-management.component.css'
})
export class SkillManagementComponent implements OnInit {
  filter: WritableSignal<string> = signal('');
  dialogVisible: WritableSignal<boolean> = signal(false);
  editing: WritableSignal<boolean> = signal(false);
  editValue = '';
  editId?: number | null;

  skills: Signal<Skill[]>;
  employees: Signal<Employee[]>;

  filteredSkills = computed(() => {
    const term = (this.filter() || '').trim().toLowerCase();
    const skills = this.skills();
    if (!term) return skills;
    return skills.filter(s => s.skill.toLowerCase().includes(term));
  });

  constructor(private repo: RepositoryService) {
    this.skills = this.repo.skillsSignal;
    this.employees = this.repo.employeesSignal;
  }

  async ngOnInit(): Promise<void> {
    await this.repo.loadAll();
  }

  openCreate() {
    this.editing.set(false);
    this.editValue = '';
    this.editId = undefined;
    this.dialogVisible.set(true);
  }

  openEdit(s: Skill) {
    this.editing.set(true);
    this.editValue = s.skill;
    this.editId = s.id;
    this.dialogVisible.set(true);
  }

  closeDialog() { this.dialogVisible.set(false); }

  async save() {
    const name = (this.editValue || '').trim();
    if (!name) return;
    try {
      if (this.editing() && this.editId) {
        await this.repo.updateSkill({ id: this.editId, skill: name });
      } else {
        await this.repo.createSkill(name);
      }
      this.dialogVisible.set(false);
    } catch (err) { console.error(err); }
  }

  usageCount(skillId?: number): number {
    if (!skillId) return 0;
    return this.employees().filter(e => e.skillSet?.some(s => s.id === skillId)).length;
  }

  async deleteSkill(skillId?: number) {
    if (!skillId) return;
    if (!confirm('Delete skill?')) return;
    try { await this.repo.deleteSkill(skillId); } catch (err) { console.error(err); }
  }
}
