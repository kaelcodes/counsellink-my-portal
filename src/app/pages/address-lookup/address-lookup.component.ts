import { Component, OnInit } from '@angular/core';
import { GlobalService } from './../../global.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { Inject} from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { StudentApiService } from './../../student-api.service';

@Component({
  selector: 'app-address-lookup',
  templateUrl: './address-lookup.component.html',
  styleUrls: ['./address-lookup.component.scss'],
})
export class AddressLookupComponent implements OnInit {
	provinces
	towncity
	barangay

	prov=''
	town=''
	bar=''
	bara=''
  constructor(public dialogRef: MatDialogRef<AddressLookupComponent>,@Inject(MAT_DIALOG_DATA) public data: any,public api:StudentApiService,public global: GlobalService) {
	 this.api.apiPublicAPIProvinces()
	  .subscribe(res => {
	   this.provinces = res
	  },Error=>{
	    this.global.swalAlertError(Error);
	  });

  }

  gettowncity(province){
	this.town = '';
	this.bar= '';
	 this.api.apiPublicAPITownsCities(province)
	  .subscribe(res => {
	   this.towncity = res
	  },Error=>{
	    this.global.swalAlertError(Error);
	  });
  }

  getbarangay(province,town){
	this.bar = '';
	this.api.apiPublicAPIBarangays(province,town)
	  .subscribe(res => {
	   this.barangay = res
	  },Error=>{
	    this.global.swalAlertError(Error);
	  });
  }


  onNoClick(): void {
  	var x='';
  	if (this.prov=='')
  		x=x+"*Provice is Required.\n"
  	if (this.town=='')
  		x=x+"*Town/City is Required.\n"
  	if (this.bar=='')
  		x=x+"*Barangay is Required."

  	if (x=='') {
       this.dialogRef.close({result: this.bara+", "+ this.town+", "+this.prov,data:this.bar});
  	}else{
  		alert(x)
  	}

  }
  onNoClickclose(): void {
       this.dialogRef.close({result:'cancel',data:this.bar});
  }
  see(z){
  	this.bara = z;
  }
  ngOnInit() {
  }

}
