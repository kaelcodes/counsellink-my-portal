import { Component, OnInit } from '@angular/core';

import {Http, Headers, RequestOptions} from '@angular/http';
import { GlobalService } from './../../global.service';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { Inject} from '@angular/core';

@Component({
  selector: 'app-terms-of-use',
  templateUrl: './terms-of-use.component.html',
  styleUrls: ['./terms-of-use.component.scss']
})
export class TermsOfUseComponent implements OnInit {

  constructor(public dialog: MatDialog,public dialogRef: MatDialogRef<TermsOfUseComponent>,@Inject(MAT_DIALOG_DATA) public data: any,public global: GlobalService,private http: Http) { }

  ngOnInit() {
  }
  noclick()
	{
	  this.dialogRef.close(1)
	}

}
