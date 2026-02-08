import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { EmployeeManagementComponent } from '../employee-management/employee-management.component';
import { SkillManagementComponent } from '../skill-management/skill-management.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, ButtonModule, EmployeeManagementComponent, SkillManagementComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  view = signal<'employees' | 'skills'>('employees');

  constructor(private auth?: AuthService) {}

  logout() {
    if (this.auth?.logout) { this.auth.logout(); }
    // else you can implement manual redirect to login
    console.log('logout requested');
  }
}
