import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardLayoutComponent } from './components/dashboard-layout/dashboard-layout.component';
import { DashboardHomeComponent } from './components/dashboard-home/dashboard-home.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        component: DashboardHomeComponent,
      },
      {
        path: 'vacation',
        loadChildren: () => 
          import('../vacation-management/vacation-management-routing.module').then(m => m.VacationManagementRoutingModule)
      },
      {
        path: 'settings',
        loadComponent: () => 
          import('../configuration/components/settings/settings.component').then(m => m.SettingsComponent)
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
