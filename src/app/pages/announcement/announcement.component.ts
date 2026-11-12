import { Component, OnInit } from '@angular/core';

import {Http, Headers, RequestOptions} from '@angular/http';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { Inject} from '@angular/core';
import { SESSION_STORAGE, WebStorageService } from 'angular-webstorage-service';

@Component({
  selector: 'app-announcement',
  templateUrl: './announcement.component.html',
  styleUrls: ['./announcement.component.scss']
})
export class AnnouncementComponent implements OnInit {

  constructor(@Inject(SESSION_STORAGE) public storage: WebStorageService,public dialog: MatDialog,public dialogRef: MatDialogRef<AnnouncementComponent>,@Inject(MAT_DIALOG_DATA) public data: any,private http: Http) { }

  ngOnInit() {
    console.log(this.storage.get('role'));
  }

noclick()
{
  this.dialogRef.close(1)
}

}
