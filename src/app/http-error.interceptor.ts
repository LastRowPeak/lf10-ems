import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppToastService } from './services/app-toast.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

  constructor(private toast: AppToastService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {

        let message = 'An unexpected error occurred.';

        if (error.status === 400) {
          message = error.error?.message || 'Invalid input.';
        }

        if (error.status === 404) {
          message = 'Resource not found.';
        }

        if (error.status === 500) {
          message = 'Server error. Please try again later.';
        }

        this.toast.error('Error', message);

        return throwError(() => error);
      })
    );
  }
}
