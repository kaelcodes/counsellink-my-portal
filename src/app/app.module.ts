import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MaterialModule } from './material.module';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { HomeComponent } from './home/home.component';
import { GlobalService } from './global.service';
import { HttpModule } from '@angular/http';
import { HttpClientModule, /* other http imports */ } from "@angular/common/http";
import { StorageServiceModule } from 'angular-webstorage-service';
import { AnnouncementComponent } from './pages/announcement/announcement.component';
import { WifiStatusComponent } from './pages/wifi-status/wifi-status.component';
import { AddressLookupComponent } from './pages/address-lookup/address-lookup.component';
import { FaqsComponent } from './popup/faqs/faqs.component';
import { DisclaimerComponent } from './popup/disclaimer/disclaimer.component';
import { TermsOfUseComponent } from './popup/terms-of-use/terms-of-use.component';
import { ChangePasswordComponent } from './main/change-password/change-password.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { DatePipe } from '@angular/common';
import { BuildDetailsHttpService } from './build-details/build-details.http.service';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { JwtModule, JWT_OPTIONS, JwtHelperService } from "@auth0/angular-jwt";
import { AuthGuardGuard } from './auth-guard/auth-guard.guard';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { AmazingTimePickerModule } from 'amazing-time-picker';
import { StudentApiService } from './student-api.service';
import { PasswordResetService } from './password-reset-service.service';
import { GuidanceModule } from './guidance/guidance.module';
import { PersonalDataEmpComponent } from './pages/personal-data-emp/personal-data-emp.component';
import { ApplicationPickComponent } from './pages/application-pick/application-pick.component';
import { PersonalDataComponent } from './pages/personal-data/personal-data.component';
import { HsEnrollmentComponent } from './pages/hs-enrollment/hs-enrollment.component';
import { HsEnrollmentFamilyBackgroundComponent } from './pages/hs-enrollment/hs-enrollment-family-background/hs-enrollment-family-background.component';
import { HsEnrollmentFamilyBackgroundFamilymemberComponent } from './pages/hs-enrollment/hs-enrollment-family-background-familymember/hs-enrollment-family-background-familymember.component';
import { HsEnrollmentFamilyBackgroundGuardianComponent } from './pages/hs-enrollment/hs-enrollment-family-background-guardian/hs-enrollment-family-background-guardian.component';
import { SampleDataPageComponent } from './pages/sample-data-page/sample-data-page.component';



export function fetchBuildDetails(buildDetailsService: BuildDetailsHttpService) {
  return () => buildDetailsService.fetchBuildDetails();
}

export function jwtOptionsFactory(GlobalService) {
  return {
    tokenGetter: () => {
      if (GlobalService.getTokenStatus())
        GlobalService.logout();
      else
        return GlobalService.getSession();
    },
    // whitelistedDomains: ["example.com"]
  }
}
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainComponent,
    HomeComponent,
    AnnouncementComponent,
    WifiStatusComponent,
    PersonalDataEmpComponent,
    AddressLookupComponent,
    FaqsComponent,
    DisclaimerComponent,
    TermsOfUseComponent,
    ChangePasswordComponent,
    ApplicationPickComponent,
    PersonalDataComponent,
    HsEnrollmentComponent,
    HsEnrollmentFamilyBackgroundComponent,
    HsEnrollmentFamilyBackgroundFamilymemberComponent,
    HsEnrollmentFamilyBackgroundGuardianComponent,
    SampleDataPageComponent,
  ],

  entryComponents: [
    AnnouncementComponent,
    WifiStatusComponent,
    AddressLookupComponent,
    FaqsComponent,
    DisclaimerComponent,
    TermsOfUseComponent,
    ChangePasswordComponent,
    ApplicationPickComponent,
    PersonalDataComponent,
    HsEnrollmentComponent,
    HsEnrollmentFamilyBackgroundComponent,
    HsEnrollmentFamilyBackgroundFamilymemberComponent,
    HsEnrollmentFamilyBackgroundGuardianComponent,
    SampleDataPageComponent,
  ],
  imports: [
    BrowserModule,
    AmazingTimePickerModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    HttpModule, StorageServiceModule,
    NgxPaginationModule, HttpClientModule,
    NgxMaterialTimepickerModule,
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
        deps: [GlobalService]
      }
    }),
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    GuidanceModule
  ],
  providers: [StudentApiService, GlobalService, DatePipe, PasswordResetService, BuildDetailsHttpService, AuthGuardGuard],
  bootstrap: [AppComponent]


})
export class AppModule { }
