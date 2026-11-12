import { Component, OnInit } from '@angular/core';
import { GlobalService } from './../../global.service';
import {Http, Headers, RequestOptions} from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { Inject} from '@angular/core';
import Swal from 'sweetalert2';
const swal = Swal;
@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {
	pword=''
	npword=''
	cpword=''
  vali=''

  info
  constructor(public dialog: MatDialog,public dialogRef: MatDialogRef<ChangePasswordComponent>,@Inject(MAT_DIALOG_DATA) public data: any,public global: GlobalService,private http: Http,) { }

  ngOnInit() {
    if (this.global.getvalidation().dp) {
      this.pword = this.global.getvalidation().pwd
    }

    if (this.global.getvalidation().dp) {
          if (!this.global.getvalidation().vali&&this.global.getvalidation().dp) {
           this.http.get(this.global.api+'StudentPortal/PersonInfo/'+this.global.requestid(),this.global.option)
                .map(response => response.json())
                .subscribe(res => {
                  this.info=res.data
                },Error=>{
                  this.global.swalAlertError()
               });
          }
            //this.updatepass()
        }
  }
  onNoClickclose(): void {
       this.dialogRef.close(undefined);
  }

  cancel(){
    this.global.logout()
  }
submit3(){
    this.global.swalLoading('');
      var x='';
      if (this.pword==''||this.npword==""||this.cpword=='') {
         x = x+"*All Fields are required!<br>";
      }
      if (this.npword != this.cpword) {
         x = x+"*New password and confirm password does not match!<br>";
      }
      if (this.npword.length < 5) {
         x = x+"*New Password must be at least 5 Characters!<br>";
      }
      if (!this.global.getvalidation().vali&&this.global.getvalidation().dp) {
        //console.log((this.info.lastName.toLowerCase().replace(/\s/g, '')+this.info.dateOfBirth.substring(5,7)+this.info.dateOfBirth.substring(8,10)+this.info.dateOfBirth.substring(0,4)))
        if (this.vali.toLowerCase().replace(/\s/g, '')!=(this.info.lastName.toLowerCase().replace(/\s/g, '')+this.info.dateOfBirth.substring(5,7)+this.info.dateOfBirth.substring(8,10)+this.info.dateOfBirth.substring(0,4))) {
          x = x+"*Verify your validation information to the office of student affairs and services (OSAS).<br>";
        }
      }
      
      if (x=='') { 
        this.global.swalLoading('');
        if (this.global.getvalidation().dp) {
          if (!this.global.getvalidation().vali) {
                  if (this.vali.toLowerCase().replace(/\s/g, '')==(this.info.lastName.toLowerCase().replace(/\s/g, '')+this.info.dateOfBirth.substring(5,7)+this.info.dateOfBirth.substring(8,10)+this.info.dateOfBirth.substring(0,4))) {
                    this.updatepass()
                  }else{
                    this.global.swalAlert("Incorrect Input.","Verify your validation information to the office of student affairs and services (OSAS).","warning")
                  }
          }else
            this.updatepass()
        }else{
          this.updatepass()
        }
      }else{
      	this.global.swalAlert('Alert!',x,'warning')
      }
  }
  updatepass(){
    this.http.put(this.global.api+'StudentPortal/ChangePassword' ,{
          "oldPassword": this.pword,
          "newPassword": this.npword,
          "newPasswordConfirm": this.cpword
        },this.global.option)
            .map(response => response.json())
            .subscribe(res => {
              if (res.message=='Password has been successfully changed.') {
                this.global.swalSuccess(res.message);
                if (this.global.getvalidation().dp) {
                    this.global.setdefaultvalidate(false,true)
                    this.dialogRef.close('saved');
                }else{
                    this.dialogRef.close(undefined);
                }
              }else
                this.global.swalAlert(res.message,'','warning')
            },Error=>{
              this.global.swalAlertError();
              console.log(Error)
            });
  }
}
