import { Component, OnInit } from '@angular/core';
import {EmployeeListComponent} from "../employee-list/employee-list.component";
import {EmployeeRepositoryService} from "../../services/employee-repository.service";
import {SkillRepositoryService} from "../../services/skill-repository.service";

@Component({
  selector: 'app-employees-overview',
  standalone: true,
  imports: [
    EmployeeListComponent
  ],
  templateUrl: './employees-overview.component.html',
  styleUrl: './employees-overview.component.css'
})
export class EmployeesOverviewComponent implements OnInit {

  constructor(
    private employeeRepo: EmployeeRepositoryService,
    private skillRepo: SkillRepositoryService
  ) {}

  ngOnInit(): void {
    this.employeeRepo.fetchEmployees();
    this.skillRepo.fetchSkills();
  }
}
