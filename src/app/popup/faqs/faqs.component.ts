import { Component, OnInit } from '@angular/core';

import {Http, Headers, RequestOptions} from '@angular/http';
import { GlobalService } from './../../global.service';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { Inject} from '@angular/core';

@Component({
  selector: 'app-faqs',
  templateUrl: './faqs.component.html',
  styleUrls: ['./faqs.component.scss']
})
export class FaqsComponent implements OnInit {

  constructor(public dialog: MatDialog,public dialogRef: MatDialogRef<FaqsComponent>,@Inject(MAT_DIALOG_DATA) public data: any,public global: GlobalService,private http: Http) { }

  ngOnInit() {
  }

  noclick()
	{
	  this.dialogRef.close(1)
	}
}
