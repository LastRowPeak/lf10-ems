import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class AppToastService {

  constructor(private messageService: MessageService) {}

  error(summary: string, detail?: string) {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: 5000
    });
  }

  success(summary: string, detail?: string) {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life: 3000
    });
  }
}
