import { Injectable, signal, Signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Employee } from '../models/employee';
import { Skill } from '../models/skill';
import { AuthService } from './auth.service'; // if you have one; otherwise remove usage or stub

@Injectable({ providedIn: 'root' })
export class RepositoryService {
  private readonly baseUrl = 'http://localhost:8089';
  private readonly employeePath:string = '/employees';
  private readonly skillPath: string = '/qualifications';


  private _employees = signal<Employee[]>([]);
  readonly employeesSignal: Signal<Employee[]> = this._employees;

  private _skills = signal<Skill[]>([]);
  readonly skillsSignal: Signal<Skill[]> = this._skills;

  // client-only selection (if needed)
  private _selectedSkillIds = signal<number[]>([]);
  readonly selectedSkillIdsSignal: Signal<number[]> = this._selectedSkillIds;

  constructor(private http: HttpClient, private authService?: AuthService) {}

  private buildHeaders(contentJson = true) {
    const token = this.authService?.getAccessToken?.();
    let headers = new HttpHeaders();
    if (contentJson) headers = headers.set('Content-Type', 'application/json');
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  // ---- Load / Cache (simple: load everything on demand, refresh after write) ----

  async loadAll(): Promise<void> {
    await Promise.all([this.loadSkills(), this.loadEmployees()]);
  }

  async loadEmployees(): Promise<Employee[]> {
    const headers = this.buildHeaders();
    try {
      const list = await firstValueFrom(this.http.get<Employee[]>(`${this.baseUrl + this.employeePath}`, { headers }));
      list.forEach(emp => {
        if (emp.skillSet && Array.isArray(emp.skillSet)) {
          emp.skillSet = emp.skillSet.slice().sort((a, b) => (a.skill > b.skill ? 1 : -1));
        }
      });
      this._employees.set(list);
      return list;
    } catch (err) {
      console.error('loadEmployees error', err);
      this._employees.set([]);
      return [];
    }
  }

  async loadSkills(): Promise<Skill[]> {
    const headers = this.buildHeaders();
    try {
      const list = await firstValueFrom(this.http.get<Skill[]>(`${this.baseUrl + this.skillPath}`, { headers }));
      list.sort((a, b) => (a.skill > b.skill ? 1 : -1));
      this._skills.set(list);
      return list;
    } catch (err) {
      console.error('loadSkills error', err);
      this._skills.set([]);
      return [];
    }
  }

  // ---- Employees CRUD ----

  async createEmployee(employee: Employee): Promise<Employee> {
    const headers = this.buildHeaders();
    const payload: any = { ...employee };
    // convert skillSet object => id array if API expects ids
    if (employee.skillSet && employee.skillSet.length && typeof employee.skillSet[0] === 'object') {
      payload.skillSet = employee.skillSet.map(s => s.id);
    }
    const created = await firstValueFrom(this.http.post<Employee>(`${this.baseUrl + this.employeePath}`, payload, { headers }));
    await this.loadEmployees();
    return created;
  }

  async updateEmployee(employee: Employee): Promise<Employee> {
    if (!employee.id) throw new Error('updateEmployee: id required');
    const headers = this.buildHeaders();
    const payload: any = { ...employee };
    if (employee.skillSet) payload.skillSet = employee.skillSet.map(s => s.id);
    const updated = await firstValueFrom(this.http.put<Employee>(`${this.baseUrl + this.employeePath}/${employee.id}`, payload, { headers }));
    await this.loadEmployees();
    return updated;
  }

  async deleteEmployee(id?: number): Promise<void> {
    if (!id) return;
    const headers = this.buildHeaders();
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl + this.employeePath}/${id}`, { headers }));
    await this.loadEmployees();
  }

  async getEmployee(id: number): Promise<Employee> {
    if (!id) throw new Error('getEmployee: id required');
    const headers = this.buildHeaders();
    const emp = await firstValueFrom(this.http.get<Employee>(`${this.baseUrl + this.employeePath}/${id}`, { headers }));
    if (emp.skillSet) emp.skillSet = emp.skillSet.slice().sort((a, b) => (a.skill > b.skill ? 1 : -1));
    return emp;
  }

  // ---- Skills CRUD ----

  async createSkill(skillName: string): Promise<Skill> {
    const headers = this.buildHeaders();
    const created = await firstValueFrom(this.http.post<Skill>(`${this.baseUrl + this.skillPath}`, { skill: skillName }, { headers }));
    await this.loadSkills();
    return created;
  }

  async updateSkill(skill: Skill): Promise<Skill> {
    if (!skill.id) throw new Error('updateSkill: id required');
    const headers = this.buildHeaders();
    const updated = await firstValueFrom(this.http.put<Skill>(`${this.baseUrl + this.skillPath}/${skill.id}`, skill, { headers }));
    await this.loadSkills();
    return updated;
  }

  async deleteSkill(skillId?: number): Promise<void> {
    if (!skillId) return;
    // naive approach: try to delete (backend may prevent if in use)
    const headers = this.buildHeaders();
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl + this.skillPath}/${skillId}`, { headers }));
    await Promise.all([this.loadSkills(), this.loadEmployees()]);
  }

  // ---- Skill <-> Employee helpers ----

  async addSkillToEmployee(employeeId: number, skillName: string): Promise<void> {
    const headers = this.buildHeaders();
    await firstValueFrom(this.http.post(`${this.baseUrl + this.employeePath}/${employeeId + this.skillPath}`, { skill: skillName }, { headers }));
    await this.loadEmployees();
  }

  // async removeSkillFromEmployee(employeeId: number, skillId: number): Promise<void> {
  //   const headers = this.buildHeaders();
  //   await firstValueFrom(this.http.delete(`${this.baseUrl + this.employeePath}/${employeeId + this.skillPath}/${skillId}`, { headers }));
  //   await this.loadEmployees();
  // }

  // ---- client-only selection state ----

  setSelectedSkillIds(ids: number[]) { this._selectedSkillIds.set(ids); }
  getSelectedSkillIds(): number[] { return this._selectedSkillIds(); }
}
