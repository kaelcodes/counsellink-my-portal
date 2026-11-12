import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
// GuidanceRouteModule is intentionally NOT imported here.
// Routes are registered inline in AppRoutingModule under main.children (outlet: 'div')
// to match My Portal's flat non-lazy routing architecture (useHash: true).
import { AppointmentSchedulerComponent } from './appointment-scheduler/appointment-scheduler.component';
import { AppointmentHistoryComponent } from './appointment-history/appointment-history.component';

@NgModule({
  imports: [CommonModule, MaterialModule],
  declarations: [AppointmentSchedulerComponent, AppointmentHistoryComponent],
  entryComponents: []
})
export class GuidanceModule { }
