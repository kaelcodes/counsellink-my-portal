import { Injectable } from '@angular/core';
import { GlobalService } from '../global.service';
import { Http, Headers, RequestOptions } from '@angular/http';

@Injectable({
  providedIn: 'root'
})
export class FacultyDTRService {

  

  constructor(private http: Http, public global: GlobalService) {}

  
  getBESFacultyAttendance(sy,idNumber) {
    return this.http.get(this.global.api + 'FacultyAttendanceMonitoring/FacultySchedule/BasicEdFaculty/' + sy + '/' + idNumber, this.global.option);
  }

  getFacultyAttendance(sy,idNumber) {
    return this.http.get(this.global.api + 'FacultyAttendanceMonitoring/FacultySchedule/' + sy + '/' + idNumber, this.global.option);
  }

  getFacultyRawDtr(sDate,eDate,idNumber) {
    return this.http.get(this.global.api + 'FacultyAttendanceMonitoring/FacultyRawDTR/' + sDate + '/' + eDate +'/'+ idNumber, this.global.option);
  }




}
