import { Component, OnInit } from '@angular/core';
import {EmployeeListComponent} from "../employee-list/employee-list.component";
import {employeeRepositoryService} from "../employee-db/employeeRepository.service";
import {skillRepositoryService} from "../skill-db/skillRepository.service";

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
    private empRepo: employeeRepositoryService,
    private skillRepo: skillRepositoryService
  ) {}

  ngOnInit(): void {
    this.empRepo.fetchEmployees();
    this.skillRepo.fetchSkills();
  }
}
