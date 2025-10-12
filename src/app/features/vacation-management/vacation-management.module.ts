import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacationManagementRoutingModule } from './vacation-management-routing.module';

/**
 * Vacation Management Feature Module
 * Handles all vacation day management, calendar view, and related functionality
 */
@NgModule({
  imports: [
    CommonModule,
    VacationManagementRoutingModule,
  ],
})
export class VacationManagementModule {}
