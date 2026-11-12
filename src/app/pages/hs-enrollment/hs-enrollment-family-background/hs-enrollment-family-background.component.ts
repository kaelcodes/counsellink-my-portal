import { Component, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { Inject} from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import {Http, Headers, RequestOptions} from '@angular/http';
import { GlobalService } from './../../../global.service';

@Component({
  selector: 'app-hs-enrollment-family-background',
  templateUrl: './hs-enrollment-family-background.component.html',
  styleUrls: ['./hs-enrollment-family-background.component.scss']
})
export class HsEnrollmentFamilyBackgroundComponent implements OnInit {


pname=''
cpno=''
lno=''
accu=''
oa=''
status=''
rel=''

ofw=false


memberid='';
constructor(public global: GlobalService,private http: Http,public dialogRef: MatDialogRef<HsEnrollmentFamilyBackgroundComponent>,@Inject(MAT_DIALOG_DATA) public data: any,) {


}

 checkbox(){
   if (this.ofw==false) {
    this.ofw = true
   }else{
     this.ofw = false;
   }
 }

  ngOnInit() {
    if (this.data.kind!=1) {
          // console.log(this.data.kind)
       this.http.get(this.global.api+'StudentPortal/Parent?parentId='+this.data.kind,this.global.option)
        .map(response => response.json())
        .subscribe(res => {
          //console.log(res.data)
          if (res.data==null) {
            this.pname=''
            this.cpno=''
            this.lno=''
            this.accu=''
            this.oa=''
            this.status=''
            this.rel=''
            this.ofw=false
          }else{
            this.pname=res.data.parentName
            this.cpno=res.data.cellphoneNo
            this.lno=res.data.landlineNo
            this.accu=res.data.occupation
            this.oa=res.data.officeAddress
            this.status=res.data.status
            this.rel=res.data.relID.toString()
            this.ofw=res.data.ofw
          }
         //console.log(res.data)
        });
    }
  }
 onNoClickclose(): void {
       this.dialogRef.close({result:'cancel'});
  }
 save(): void {
   var x='';
   if (this.pname == '') {
     x = x + "*Parent's name is required.<br>"
   }
   if (this.status == '') {
     x = x + "*Status is required.<br>"
   }
   if (this.rel == '') {
     x = x + "*Reletionship is required.<br>"
   }

   if(x==''){
      this.http.post(this.global.api+'StudentPortal/ParentGuardian/'+this.data.id ,{
          "parentName": this.pname,
          "relID": this.rel,
          "cellphoneNo": this.cpno,
          "landlineNo": this.lno,
          "officeAddress": this.oa,
          "occupation": this.accu,
          "status": this.status,
           "ofw": this.ofw
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

 update(): void {
   var x='';
   if (this.pname == '') {
     x = x + "*Parent's name is required.<br>"
   }
   if (this.status == '') {
     x = x + "*Status is required.<br>"
   }
   if (this.rel == '') {
     x = x + "*Reletionship is required.<br>"
   }

   if(x==''){
      this.http.put(this.global.api+'StudentPortal/ParentGuardian/'+this.data.kind,{
          "memberId":this.data.kind,
          "parentName": this.pname,
          "relID": this.rel,
          "cellphoneNo": this.cpno,
          "landlineNo": this.lno,
          "officeAddress": this.oa,
          "occupation": this.accu,
          "status": this.status,
           "ofw": this.ofw
          },this.global.option)
          .map(response => response.json())
          .subscribe(res => {
            // console.log(res)
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
