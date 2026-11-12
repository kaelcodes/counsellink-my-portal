import { Component, OnInit } from '@angular/core';
import {Http, Headers, RequestOptions} from '@angular/http';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import Swal from 'sweetalert2';
const swal = Swal;

import { GlobalService } from './../../global.service';
import { StudentApiService } from './../../student-api.service';


import { HsEnrollmentFamilyBackgroundComponent } from './../hs-enrollment/hs-enrollment-family-background/hs-enrollment-family-background.component';
import { HsEnrollmentFamilyBackgroundFamilymemberComponent } from './../hs-enrollment/hs-enrollment-family-background-familymember/hs-enrollment-family-background-familymember.component';
import { HsEnrollmentFamilyBackgroundGuardianComponent } from './../hs-enrollment/hs-enrollment-family-background-guardian/hs-enrollment-family-background-guardian.component';
@Component({
  selector: 'app-personal-data',
  templateUrl: './personal-data.component.html',
  styleUrls: ['./personal-data.component.scss']
})
export class PersonalDataComponent implements OnInit {
  familyarray=[]
  educarray=[]
  serverdate

  dueDate = new Date('11/12/2024');
  currentDate = new Date();
  dueDateOnly = new Date();
  currentDateOnly = new Date();

  constructor(public dialog: MatDialog,public global: GlobalService,private http: Http,public api:StudentApiService) { }

  ngOnInit() {
    console.log(this.global.studinfo);
    console.log(this.global.shsGrade11Enrollment, this.global.hsEnrollment, this.global.jhsGrade7Enrollment, this.global.jhsEnrollment);
    this.getCurrentServerTime()
    this.loadFmg()
  }

  getCurrentServerTime(){
    this.global.apiPublicAPICurrentServerTime()
    .subscribe(res => {
      var today: any = new Date(res.data);
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      var yyyy = today.getFullYear();
      today = mm + '/' + dd + '/' + yyyy;
      this.serverdate = today;

      this.currentDate = new Date(this.serverdate);
      this.dueDateOnly = new Date(this.dueDate.getFullYear(), this.dueDate.getMonth(), this.dueDate.getDate());
      this.currentDateOnly = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate());
    }, Error => {
      // that.swalAlertError();
      // that.logout();
    });

  }

  displaycs(x){
      if (x=='S') {
        return 'Single'
      }
      if (x=='M') {
        return 'Married'
      }
      if (x=='W') {
        return 'Widow'
      }
  }
  displayg(x){
      if (x=='M') {
        return 'Male'
      }
      if (x=='F') {
        return 'Female'
      }
  }

  loadFmg(){

    this.familyarray = []
    this.api.apiStudentPortalFamilyBG()
    .subscribe(res => {
      res.data.forEach(member => {
        this.http.get(this.global.api+'StudentPortal/Parent?parentId='+member.memberIdNumber,this.global.option)
        .map(response => response.json())
        .subscribe(res => {
          this.familyarray.push({
            ...member,
            ...res.data
          })
        });
      });
      // console.log(this.familyarray);
    });
  }

  checkparent(){
    var count=0
    for (var i = 0; i < this.familyarray.length; ++i) {
      if (this.familyarray[i].relDesc=='Mother'||this.familyarray[i].relDesc=='Father') {
        count++
      }
    }
    if (count>1) {
      return true
    }
    return  false
  }

  openedit(x,y){//(memberID,relDesc)
    if (y=='Mother'||y=='Father') {
      this.openDialogAddParent(x)
    }
    else if (y=='Brother/Sister'||y=='Guardian'||y=='Cousin'||y=='Uncle/Aunt'||y=='Grand Parent'||y=='StepFather'||y=='StepMother'||y=='Spouse'){
      this.openDialogguardian(x)
    }else{
      this.openDialogfamilymember(x)
    }
  }

  openDialogAddParent(lookup): void {
    const dialogRef = this.dialog.open(HsEnrollmentFamilyBackgroundComponent, {
    width: '600px', disableClose: false, data: {id:this.global.userinfo.idNumber,kind:lookup},
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result!=undefined) {
      if (result.result=='cancel') {
      }
      if (result.result=='saved') {
        this.loadFmg();
      }
    }
    });
  }

  openDialogguardian(lookup): void {
    const dialogRef = this.dialog.open(HsEnrollmentFamilyBackgroundGuardianComponent, {
    width: '600px', disableClose: false, data: {id:this.global.userinfo.idNumber,kind:lookup},
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result!=undefined) {
        if (result.result=='cancel') {
        }
        if (result.result=='saved') {
          this.loadFmg();
        }
    }
    });
  }

  openDialogfamilymember(lookup): void {
      const dialogRef = this.dialog.open(HsEnrollmentFamilyBackgroundFamilymemberComponent, {
      width: '600px', disableClose: false, data: {id:this.global.userinfo.idNumber,kind:lookup},
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result!=undefined) {
        if (result.result=='cancel') {
        }
        if (result.result=='saved') {
          this.loadFmg();
        }
      }
      });
  }

  deletefamily(id){
    this.swalConfirmdelete("Are you sure?","You won't be able to revert this!",'warning','Delete Family Member Info','Family Member Info has been Removed','deletefamily',id);
  }

  swalConfirmdelete(title,text,type,button,successm,remove,id){
    swal({
        title: title,
        text: text,
        type: type,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: button
      }).then((result) => {
        if (result.value) {
          if (remove=='deletefamily') {
          this.global.swalLoading('');
            this.api.apiStudentPortalFamilyMemberDelete(id)
              .subscribe(res => {
                this.global.swalSuccess(successm);
                this.loadFmg();
              },Error=>{
                this.global.swalAlertError(Error);
              });
          }
          else if (remove=='deleteeb') {
            // this.global.swalLoading('');
            // this.api.apiStudentPortalEducBGDelete(id)
            //   .subscribe(res => {
            //     this.global.swalSuccess(successm);
            //     this.loadeducbg();
            //   },Error=>{
            //     this.global.swalAlertError(Error);
            //   });
          }
        }
      })
  }

}
