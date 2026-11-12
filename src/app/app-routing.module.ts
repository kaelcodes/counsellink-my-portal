import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { HomeComponent } from './home/home.component';
import { PersonalDataEmpComponent } from './pages/personal-data-emp/personal-data-emp.component';
import { PersonalDataComponent } from './pages/personal-data/personal-data.component';
import { HsEnrollmentComponent } from './pages/hs-enrollment/hs-enrollment.component';
import { SampleDataPageComponent } from './pages/sample-data-page/sample-data-page.component';
import { AppointmentSchedulerComponent } from './guidance/appointment-scheduler/appointment-scheduler.component';
import { AppointmentHistoryComponent } from './guidance/appointment-history/appointment-history.component';
import { ApiIntegrationComponent } from './guidance/api-integration/api-integration.component';


const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'main',
    component: MainComponent,
    children: [
      { path: 'home', component: HomeComponent, outlet: 'div' },
      { path: 'personal-data-emp', component: PersonalDataEmpComponent, outlet: 'div' },
      { path: 'personal-data', component: PersonalDataComponent, outlet: 'div' },
      { path: 'hs-enrollment', component: HsEnrollmentComponent, outlet: 'div' },
      { path: 'sample-data-page', component: SampleDataPageComponent, outlet: 'div' },
      // Guidance Counseling — student-facing routes (registered inline, not via GuidanceRouteModule,
      // because My Portal's main is not lazy-loaded and forChild would register at root).
      { path: 'guidance-scheduler', component: AppointmentSchedulerComponent, outlet: 'div' },
      { path: 'guidance-history', component: AppointmentHistoryComponent, outlet: 'div' },
      { path: 'guidance-api-integration', component: ApiIntegrationComponent, outlet: 'div' }
    ]
  },
  {
    path: '**', component: LoginComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
