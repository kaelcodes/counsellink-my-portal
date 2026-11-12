import { Component, OnInit } from '@angular/core';
import {Http, Headers, RequestOptions} from '@angular/http';
import { GlobalService } from './../../global.service';

@Component({
  selector: 'app-personal-data-emp',
  templateUrl: './personal-data-emp.component.html',
  styleUrls: ['./personal-data-emp.component.scss']
})
export class PersonalDataEmpComponent implements OnInit {

familyarray=[]
educarray=[]
  constructor(public global: GlobalService,private http: Http) { }

  ngOnInit() {

    console.log(this.global.schoolyear);
  }

  ngafter

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
}
