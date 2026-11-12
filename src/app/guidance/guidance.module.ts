import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material.module';
// GuidanceRouteModule is intentionally NOT imported here.
// Routes are registered inline in AppRoutingModule under main.children (outlet: 'div')
// to match My Portal's flat non-lazy routing architecture (useHash: true).
import { AppointmentSchedulerComponent } from './appointment-scheduler/appointment-scheduler.component';
import { AppointmentHistoryComponent } from './appointment-history/appointment-history.component';
import { ApiIntegrationComponent } from './api-integration/api-integration.component';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  declarations: [AppointmentSchedulerComponent, AppointmentHistoryComponent, ApiIntegrationComponent],
  entryComponents: []
})
export class GuidanceModule { }
