import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {EmployeeManagementComponent} from "./components/employee-management/employee-management.component";
import {SkillManagementComponent} from "./components/skill-management/skill-management.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, EmployeeManagementComponent, SkillManagementComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'lf10StarterNew';
}
