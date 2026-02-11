import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {provideOAuthClient} from "angular-oauth2-oidc";
import {providePrimeNG} from "primeng/config";
import Aura from '@primeuix/themes/aura';
import {provideAnimations} from "@angular/platform-browser/animations";
import {HttpErrorInterceptor} from "./http-error.interceptor";
import {MessageService} from "primeng/api";


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    },
    provideOAuthClient(),
    providePrimeNG({theme: {preset: Aura }}),
    provideAnimations(),
    MessageService
  ]
};
