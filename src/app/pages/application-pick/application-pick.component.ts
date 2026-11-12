import { Component, OnInit } from '@angular/core';
import { Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {MatSnackBar} from '@angular/material';
import { GlobalService } from './../../global.service';

@Component({
  selector: 'app-application-pick',
  templateUrl: './application-pick.component.html',
  styleUrls: ['./application-pick.component.scss']
})
export class ApplicationPickComponent implements OnInit {

constructor(public global: GlobalService,private snackBar: MatSnackBar,public dialog: MatDialog,public dialogRef: MatDialogRef<ApplicationPickComponent>,@Inject(MAT_DIALOG_DATA) public data: any,) {}

  openSnackBar(message: string, action: string) {
  	message ="Access Denied for "+ message+" Portal"
    this.snackBar.open(message, action, {
      duration: 2000,
      verticalPosition:'top'
    });
  }
  checkportal(text){
  	for (var i = 0; i < this.data.roles.length; ++i) {
  		if (this.data.roles[i]==text) {
  			return true
  		}
  	}
  	return false
  }
  ngOnInit() {
    console.log("here");

  }

  proceed(text){
    this.global.setrole(text)
    this.global.portaltext=text
	  this.dialogRef.close({result:'saved'});
  }

  noclick(): void {
      this.global.logout()
  }
}
