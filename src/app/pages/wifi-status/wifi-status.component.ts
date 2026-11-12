import { Component, OnInit } from '@angular/core';
import { GlobalService } from './../../global.service';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { Inject} from '@angular/core';

import { Observable } from 'rxjs';
import {Http, Headers, RequestOptions} from '@angular/http';

@Component({
  selector: 'app-wifi-status',
  templateUrl: './wifi-status.component.html',
  styleUrls: ['./wifi-status.component.scss']
})
export class WifiStatusComponent implements OnInit {
	check
  constructor(public dialog: MatDialog,public dialogRef: MatDialogRef<WifiStatusComponent>,@Inject(MAT_DIALOG_DATA) public data: any,public global: GlobalService,
  private http: Http,) {
    if(this.global.requestrole() == "Student")
      this.getCorporateEmail(this.global.requestid(),'StudentPortal')
  }

  UserType = '';
  corporateEmailArray;
  corporateEmail;
  corporateEmailPassword;
  ngOnInit() {
    this.UserType = this.data.type;
    // console.log(this.global.wifi)
  	this.check=((6000-this.global.wifi.userCredit)/6000)*100;
    // console.log(this.global.requestrole())

  }
  tempdata
  getCorporateEmail(id,portaltype){
    this.apiGetCorporateEmail(id,portaltype).subscribe(res =>{
      this.tempdata = res;


          this.http.post(this.global.api+portaltype+'/CorporateEmail/'+this.global.sy,{
          },this.global.option)
            .map(response => response.json())
            .subscribe(res => {
              this.apiGetCorporateEmail(id,portaltype).subscribe(res =>{
                this.tempdata = res;
                if(this.tempdata.data == null)
                  assignValues('','','');
                else
                  assignValues(this.tempdata.data, this.tempdata.data.emailAddress, this.tempdata.data.password);
              })
                this.global.swalClose();
            },Error=>{
              this.global.swalAlertError();
              console.log(Error)
            });

    })

    var that = this;
    function assignValues(array,email,password){//function to assign values of corporate email details for display
      that.corporateEmailArray = array;
      that.corporateEmail = email;
      that.corporateEmailPassword = password;
    }
  }

  apiGetCorporateEmail(id,y): Observable<any>{
    // var sy = this.global.constSY;
    // if(this.global.studinfo.level == "HIGHSCHOOL")
    //   sy = sy.substring(0,6);//removes the semester in the sy if the level is HS
    // else
    //   sy = this.global.constSY;
    return this.http.get(this.global.api+y+'/CorporateEmail/',this.global.option)
    .map(response => response.json())
    }

  noclick()
  {
    this.dialogRef.close(1)
  }

}
