import { Routes } from '@angular/router';
import { configGuard } from './core/guards/config.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => 
      import('./features/dashboard/dashboard-routing.module').then(m => m.DashboardRoutingModule),
    canActivate: [configGuard],
    canActivateChild: [configGuard]
  },
  {
    path: 'setup',
    loadComponent: () => 
      import('./features/configuration/components/setup-wizard/setup-wizard.component').then(m => m.SetupWizardComponent)
  }
];
