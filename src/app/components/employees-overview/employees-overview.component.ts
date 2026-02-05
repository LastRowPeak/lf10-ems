import { Component, OnInit } from '@angular/core';
import {EmployeeListComponent} from "../employee-list/employee-list.component";
import {FilterComponent} from "../filter/filter.component";
import {employeeRepositoryService} from "../employee-db/employeeRepository.service";

@Component({
  selector: 'app-employees-overview',
  standalone: true,
  imports: [
    EmployeeListComponent,
    FilterComponent
  ],
  templateUrl: './employees-overview.component.html',
  styleUrl: './employees-overview.component.css'
})
export class EmployeesOverviewComponent implements OnInit {

  constructor(private dbService: employeeRepositoryService) {}

  ngOnInit(): void {
    this.dbService.fetchEmployees();
    //TODO Skills fetchQualifications
    this.dbService.fetchQualifications();
  }
}
