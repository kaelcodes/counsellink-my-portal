import { Component } from '@angular/core';
import {Router} from "@angular/router";
import { GlobalService } from './global.service';

import { AfterViewInit, ElementRef, } from '@angular/core';
import { FaqsComponent } from './popup/faqs/faqs.component';
import { DisclaimerComponent } from './popup/disclaimer/disclaimer.component';
import { TermsOfUseComponent } from './popup/terms-of-use/terms-of-use.component';
import {MatSnackBar} from '@angular/material';
import { MatDialog,MatDialogRef } from '@angular/material';
import {Http, Headers, RequestOptions} from '@angular/http';
import Swal from 'sweetalert2';
const swal = Swal;
import { SignalRService } from './services/signal-r.service';

import { UpToDateBuildService } from './build-details/up-to-date.service';
import { StudentApiService } from './student-api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'app';
  routerlink = "login";
	public data:any
  public buildIsUpToDate = true;

  hasUpdate = false;

  constructor(
    private elRef:ElementRef,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    public global: GlobalService,
    private router: Router,
    private http: Http,
    UpToDateBuildService:UpToDateBuildService,
    public signalRService: SignalRService,
    private api: StudentApiService,
    ){
    var dt = new Date();
    setTimeout(console.log.bind(console, '%cStop!', 'color: red;font-size:75px;font-weight:bold;-webkit-text-stroke: 1px black;'), 0);
    setTimeout(console.log.bind(console, '%cThis is a browser feature intended for developers.', 'color: black;font-size:20px;'), 0);
    this.global.year = dt.getFullYear()  //get active year for the GENERAL -> New Person registration -> ID extension
    UpToDateBuildService.buildIsUpToDate.subscribe(buildIsUpToDate => {
      this.buildIsUpToDate = buildIsUpToDate;
  });
  }

  openSnackBar(message: string, action: string) {
    message ="Access Denied for "+ message+" Portal"
    this.snackBar.open(message, action, {
      duration: 2000,
      verticalPosition:'top'
    });
  }
  checkportal(text){
    for (var i = 0; i < this.global.userroles.length; ++i) {
      if (this.global.userroles[i]==text) {
        return true
      }
    }
    return false
  }

  ngOnInit() {
    if (this.global.requestrole()!=null) {
      this.global.portaltext=this.global.requestrole()
    }else{
      this.global.portaltext="USL My"
    }
    this.signalRService.startConnection();
    this.signalRService.addTransferNotificationtDataListener();
    this.getNotification();
  }
  getNotification() {
    this.api.getPublicNotifications()
      .map(response => response.json())
      .subscribe(res => {
        this.signalRService.data=res.data
        //console.log(res.data)
      }, Error => {
        //this.global.swalAlertError(Error)
      })
  }

  proceed(text){
    if (this.global.requestrole()==text) {
      // code...
    }else{
      this.global.setrole(text)
      window.location.reload();
    }

  }

  logout(){
  	this.global.logout();
  }

openDialogTermsOfUse(): void {
    const dialogRef = this.dialog.open(TermsOfUseComponent, {
         width: '80%', disableClose: false
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result!=undefined) {
            if (result.result=='saved') {
            }
          }
        });
    }
openDialogDisclaimerComponent(): void {
    const dialogRef = this.dialog.open(DisclaimerComponent, {
          width: '80%', disableClose: false
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result!=undefined) {
            if (result.result=='saved') {
            }
          }
        });
    }
openDialogFaqsComponent(): void {
    const dialogRef = this.dialog.open(FaqsComponent, {
          width: '80%', disableClose: false
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result!=undefined) {
            if (result.result=='saved') {
            }
          }
        });
    }

  ngAfterViewInit() {
     let loader = this.elRef.nativeElement.querySelector('#loader');
     document.getElementById("loader").style.display = "none";
  }
}
