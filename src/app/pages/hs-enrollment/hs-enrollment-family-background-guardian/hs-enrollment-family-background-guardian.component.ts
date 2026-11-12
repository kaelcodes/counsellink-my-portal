import { Component, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { Inject} from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import {Http, Headers, RequestOptions} from '@angular/http';
import { GlobalService } from './../../../global.service';

@Component({
  selector: 'app-hs-enrollment-family-background-guardian',
  templateUrl: './hs-enrollment-family-background-guardian.component.html',
  styleUrls: ['./hs-enrollment-family-background-guardian.component.scss']
})
export class HsEnrollmentFamilyBackgroundGuardianComponent implements OnInit {

name=''
cpno=''
address=''
rel=''

constructor(public global: GlobalService,private http: Http,public dialogRef: MatDialogRef<HsEnrollmentFamilyBackgroundGuardianComponent>,@Inject(MAT_DIALOG_DATA) public data: any,) { 
 

}


  ngOnInit() {
    if (this.data.kind!=1) {
       this.http.get(this.global.api+'StudentPortal/Parent?parentId='+this.data.kind,this.global.option)
        .map(response => response.json())
        .subscribe(res => {
          if (res.data==null) {
            this.name=''
            this.cpno=''
            this.address=''
            this.rel=''
          }else{
            this.name=res.data.parentName
            this.cpno=res.data.cellphoneNo
            this.address=res.data.officeAddress
            this.rel=res.data.relID.toString()
          }
        },Error=>{
            this.global.swalAlertError(Error);
            console.log(Error)
        });
    }
  }
 onNoClickclose(): void {
       this.dialogRef.close({result:'cancel'});
  }
 save(): void {
   var x='';
   if (this.name == '') {
     x = x + "*Guardian's name is required.<br>"
   }
   if (this.rel == '') {
     x = x + "*Reletionship is required.<br>"
   }

   if(x==''){
      this.http.post(this.global.api+'StudentPortal/ParentGuardian/'+this.data.id ,{
	          "parentName": this.name,
	          "relID": this.rel,
	          "cellphoneNo": this.cpno,
	          "officeAddress": this.address,
			  "landlineNo": "",
			  "occupation": "",
			  "status": "",
			  "ofw": false
          },this.global.option)
          .map(response => response.json())
          .subscribe(res => {
            this.dialogRef.close({result:'saved'});
            this.global.swalSuccess(res.message);
          },Error=>{
            this.global.swalAlertError(Error);
            console.log(Error)
        });
     }else{
       this.global.swalAlert('Required fields!',x,'warning')
     }
  }

 update(): void {
   var x='';
   if (this.name == '') {
     x = x + "*Guardian's name is required.<br>"
   }
   if (this.rel == '') {
     x = x + "*Reletionship is required.<br>"
   }

   if(x==''){
      this.http.put(this.global.api+'StudentPortal/ParentGuardian/'+this.data.kind ,{
	          "parentName": this.name,
	          "relID": this.rel,
	          "cellphoneNo": this.cpno,
	          "officeAddress": this.address,
			  "landlineNo": "",
			  "occupation": "",
			  "status": "",
			  "ofw": false,
			  "memberId": "",
          },this.global.option)
          .map(response => response.json())
          .subscribe(res => {
            this.dialogRef.close({result:'saved'});
            this.global.swalSuccess(res.message);
          },Error=>{
            this.global.swalAlertError();
            console.log(Error)
        });
     }else{
       this.global.swalAlert('Required fields!',x,'warning')
     }
  }
}
