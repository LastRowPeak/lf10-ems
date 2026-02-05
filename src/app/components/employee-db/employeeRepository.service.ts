import { Injectable } from '@angular/core';
import { Employee } from "../../model/Employee";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthService } from "./auth.service";
import { BehaviorSubject, Observable, of, forkJoin } from "rxjs";
import { Router } from "@angular/router";
//TODO: Skills import
import { Skill } from "../../model/Skill";
import { map, tap, switchMap, take } from 'rxjs/operators';

interface EmployeeSkillTuple {
  skill: Skill;
  employees: Employee[];
}

@Injectable({
  providedIn: 'root'
})
export class employeeRepositoryService {
  private employeesSubject = new BehaviorSubject<Employee[]>([]);
  public employees$ = this.employeesSubject.asObservable(); //employees als Observable um immer die gleichen zu lesen
  private token!: string | string[];

  constructor(
    private http: HttpClient,
    protected authService: AuthService,
  ) {
  }

  getEmployees(): Observable<Employee[]> {
    return this.employees$;
  }

  fetchEmployees() {
    this.token = this.authService.getAccessToken();
    this.http.get<Employee[]>('http://localhost:8089/employees', {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${this.token}`)
    }).subscribe(list => {
      list.forEach(emp => {
        if (emp.skillSet) {
          //TODO Skillsort
        }
      });
      this.employeesSubject.next(list);
    });
  }

  getEmployee(id: number): Observable<Employee> {
    this.token = this.authService.getAccessToken();
    return this.http.get<Employee>(`http://localhost:8089/employees/${id}`, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
    }).pipe(
      tap(employee => {
        if (employee && employee.skillSet) {
        //TODO Skillsort
        }
      })
    );
  }

  getEmployeesBySkill(skillId: number): Observable<Employee[]> {
    this.token = this.authService.getAccessToken();
    return this.http.get<EmployeeSkillTuple>(`http://localhost:8089/skills/${skillId}/employees`, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
    }).pipe(
      map(response => response.employees)
    );
  }

  createEmployee(employee: Employee): Observable<Employee> {
    this.token = this.authService.getAccessToken();
    const payload: any = { ...employee };
    // The skillSet is already an array of IDs when coming from the sample data generation
    if (employee.skillSet && employee.skillSet.length > 0 && typeof employee.skillSet[0] === 'object') {
      payload.skillSet = employee.skillSet.map((s: any) => s.id);
    }

    return this.http.post<Employee>('http://localhost:8089/employees', payload, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
    }).pipe(
      tap(() => this.fetchEmployees())
    );
  }

  updateEmployee(employee: Employee): Observable<any> {
    this.token = this.authService.getAccessToken();
    const payload: any = { ...employee };
    if (employee.skillSet) {
      payload.skillSet = employee.skillSet.map(s => s.id);
    }

    return this.http.put(`http://localhost:8089/employees/${employee.id}`, payload, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
    }).pipe(
      tap(() => this.fetchEmployees())
    );
  }

  deleteEmployee(id: number | undefined) {
    if (id == null) return;

    this.token = this.authService.getAccessToken();

    this.http.delete(`http://localhost:8089/employees/${id}`, {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
    }).subscribe({
      next: () => this.fetchEmployees(),
      error: (err: Error) => console.error('Delete failed', err)
    });
  }

  deleteSkill(id: number): Observable<any> {
    const employeeDb: employeeRepositoryService = new employeeRepositoryService(this.http, this.authService);
    return employeeDb.getEmployeesBySkill(id).pipe(
      take(1),
      switchMap(employeesToUpdate => {
        if (employeesToUpdate && employeesToUpdate.length > 0) {
          const updateObservables = employeesToUpdate.map(emp => {
            return employeeDb.getEmployee(emp.id!).pipe(
              switchMap(fullEmployee => {
                fullEmployee.skillSet = fullEmployee.skillSet?.filter(s => s.id !== id);
                return employeeDb.updateEmployee(fullEmployee);
              })
            );
          });
          return forkJoin(updateObservables);
        }
        return of(null);
      }),
      switchMap(() => this.deleteSkill(id))
    );
  }
}
