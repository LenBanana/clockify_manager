import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VacationManagerComponent } from './components/vacation-manager/vacation-manager.component';

const routes: Routes = [
  {
    path: '',
    component: VacationManagerComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VacationManagementRoutingModule {}
