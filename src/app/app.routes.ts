import { Routes } from '@angular/router';
import {ShellComponent} from "./components/shell/shell.component";
import {authGuard} from "./guards/auth.guard";
import {CallbackComponent} from "./components/callback/callback.component";

export const routes: Routes = [
  { path: '', component: ShellComponent, canActivate: [authGuard] },
  { path: 'callback', component: CallbackComponent },

];
