import {Injectable} from '@angular/core';
import {Employee} from "../model/Employee";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {BehaviorSubject, Observable, of, forkJoin} from "rxjs";
import {Skill} from "../model/Skill";
import {map, tap, switchMap, take} from 'rxjs/operators';
import {AuthService} from "./auth.service";

@Injectable({
  providedIn: 'root'
})
export class SkillRepositoryService {
  private selectedSkillIdsSubject = new BehaviorSubject<number[]>([]);
  public selectedSkillIds$ = this.selectedSkillIdsSubject.asObservable(); //lesbare version des BehaviourSubjects als observable für htmls

  private skillsSubject = new BehaviorSubject<Skill[]>([]);
  public skills$ = this.skillsSubject.asObservable();
  private token!: string | string[];

  constructor(
    private http: HttpClient,
    protected authService: AuthService,
  ) {
  }

  deleteSkill(id: number | undefined): Observable<any> {
    if (id == null) return of(null);

    this.token = this.authService.getAccessToken();

    return this.http.delete(`http://localhost:8089/skills/${id}`, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
    }).pipe(
      tap(() => this.fetchSkills())
    );
  }

  deleteSkillFromEmployee(employeeId: number, skillId: number): Observable<any> {
    this.token = this.authService.getAccessToken();
    return this.http.delete(`http://localhost:8089/employees/${employeeId}/skills/${skillId}`, {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${this.token}`)
    });
  }

  updateSkill(skill: Skill): Observable<Skill> {
    this.token = this.authService.getAccessToken();
    return this.http.put<Skill>(`http://localhost:8089/skills/${skill.id}`, skill, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
    });
  }

  fetchSkills() {
    this.http.get<Skill[]>('http://localhost:8089/skills', {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
    }).subscribe(skills => {
      //TODO SORT THIS
      this.skillsSubject.next(skills)
    });
  }

  createSkill(skillName: string): Observable<Skill> {
    this.token = this.authService.getAccessToken();
    return this.http.post<Skill>('http://localhost:8089/skills', {skill: skillName}, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
    });
  }

  getEmployeeSkills(employeeId: number): Observable<Skill[]> {
    this.token = this.authService.getAccessToken();
    return this.http.get<Employee>(`http://localhost:8089/employees/${employeeId}/skills`, {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${this.token}`)
    }).pipe(
      map(employee => {
        const skillSet = employee.skillSet || [];
        //TODO SORT THIS
        return skillSet;
      })
    );
  }

  addSkillToEmployee(employeeId: number, skillName: string): Observable<any> {
    this.token = this.authService.getAccessToken();
    return this.http.post(`http://localhost:8089/employees/${employeeId}/skills`, {"skill": skillName}, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
    });
  }
}
