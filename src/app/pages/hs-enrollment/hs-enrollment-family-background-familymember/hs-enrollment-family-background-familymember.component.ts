import { Component, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { Inject} from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import {Http, Headers, RequestOptions} from '@angular/http';
import { GlobalService } from './../../../global.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-hs-enrollment-family-background-familymember',
  templateUrl: './hs-enrollment-family-background-familymember.component.html',
  styleUrls: ['./hs-enrollment-family-background-familymember.component.scss']
})
export class HsEnrollmentFamilyBackgroundFamilymemberComponent implements OnInit {


lname=''
fname=''
mname=''
suffix=''
id=''
yearlevel=''
course=''
image:any = 'assets/noimage.jpg';
checkid=''
saveButtonTrigger = false;
constructor(private domSanitizer: DomSanitizer,public global: GlobalService,private http: Http,public dialogRef: MatDialogRef<HsEnrollmentFamilyBackgroundFamilymemberComponent>,@Inject(MAT_DIALOG_DATA) public data: any,) {


}


  ngOnInit() {
    if (this.data.kind!=1) {
    	this.checkid= this.data.kind;
    	this.id = this.data.kind;
    	this.keyDownFunction('onoutfocus')
    }
    this.saveButtonTrigger = false;
  }
 onNoClickclose(): void {
       this.dialogRef.close({result:'cancel'});
  }
 save(): void {
   var x='';
   if (this.id == '') {
     x = x + "*ID Number name is required.<br>"
   }
   if(x=='' && this.lname!=''){
      this.http.post(this.global.api+'StudentPortal/FamilyMember/',{
			  "memberId": this.id,
			  "relationship": 2
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
       this.global.swalAlert('Sibling ID number is required!',x,'warning')
     }
  }


  keyDownFunction(event){

  if(event.keyCode == 13 || event.keyCode == 9 || event == 'onoutfocus') {
  	if (this.id != '') {
    this.global.swalLoading('Loading Student Information');
    // console.log(this.id)
    var thisID = this.id;
    this.http.get(this.global.api+'Student/PersonInfo/'+thisID,this.global.option)
        .map(response => response.json())
        .subscribe(res => {
          // console.log(res.data)
          this.global.swalClose();
          if (res.data!=null) {
              this.image = this.domSanitizer.bypassSecurityTrustUrl('data:image/jpeg;base64,'+res.data.idPicture);
              this.fname=res.data.firstName;
              this.mname=res.data.middleName;
              this.lname=res.data.lastName;
              this.suffix=res.data.suffixName;
              this.saveButtonTrigger = true;
              // this.yearlevel = res.data.yearOrGradeLevel.toString();
              // this.course = res.data.course.toString();
              // this.checkid = this.id;
          }else{
	          this.global.swalAlert(res.message,'','warning')
	          this.clear();
          }

        },Error=>{
          this.global.swalAlertError(Error);
        });
      }
    }
  }
  clear(){
  	this.lname=''
	this.fname=''
	this.mname=''
	this.suffix=''
	this.id=''
	this.image = 'assets/noimage.jpg';

    this.checkid = '';
	this.yearlevel=''
	this.course=''
  }
}
