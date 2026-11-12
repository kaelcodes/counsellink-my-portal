import { Injectable } from '@angular/core';
import { GlobalService } from './global.service';
import { Http, Headers, RequestOptions } from '@angular/http';

@Injectable({
  providedIn: 'root'
})
export class HrisLeaveManagementApiService {

  constructor(private http: Http, public global: GlobalService) { }

  getLeaveManagementSchedule() {
    return this.http.get(this.global.api + 'EmployeePortal/Employee/Schedule/', this.global.option);
  }


  getEmployeePortalAppointmentbyActive(idNumber, active) {
    return this.http.get(this.global.api + 'Employee/Appointment/' + idNumber + '?active=' + active, this.global.option);
  }

  getLeaveManagementDepartment(id) {
    return this.http.get(this.global.api + 'LeaveManagement/Department?departmentID=' + id, this.global.option);
  }

  getEmployeePortalLeaves(idNumber, sy) {
    return this.http.get(this.global.api + 'EmployeePortal/Leaves/' + idNumber + '/' + sy, this.global.option);
  }

  getEmployeeTrainingType() {
    return this.http.get(this.global.api + 'EmployeePortal/TraningType', this.global.option);
  }

  getEmployeePortalLeave() {

    return this.http.get(this.global.api + 'EmployeePortalLeave/Leave/', this.global.option);
  }

  postEmployeePortalLeave(data) {
    return this.http.post(this.global.api + 'EmployeePortalLeave/Leave/', data, this.global.option)
  }

  putEmployeePortalLeave(id, data) {
    return this.http.put(this.global.api + 'EmployeePortalLeave/Leave/' + id, data, this.global.option)
  }

  deleteEmployeePortalLeave(leaveID) {
    return this.http.delete(this.global.api + 'EmployeePortalLeave/Leave/' + leaveID, this.global.option)
  }

  postEmployeePortalLeaveDuration(leaveID, data) {
    return this.http.post(this.global.api + 'EmployeePortalLeave/LeaveDuration/' + leaveID, data, this.global.option)
  }

  postEmployeePortalBESFacultyLeaveDetail(data) {
    return this.http.post(this.global.api + 'EmployeePortalLeave/BESFacultyLeaveDetail/', data, this.global.option)
  }


  putEmployeePortalLeaveDuration(leaveID, idNumber, data) {
    return this.http.put(this.global.api + 'EmployeePortalLeave/LeaveDuration/' + leaveID + '/' + idNumber, data, this.global.option)
  }

  deleteEmployeePortalLeaveDuration(leaveId, leaveIdDuration) {
    return this.http.delete(this.global.api + 'EmployeePortalLeave/LeaveDuration/' + leaveId + '/' + leaveIdDuration, this.global.option)
  }

  getReportTeacherCodeSummaryFacultyID2(syear, instructorId, departmentF) {
    return this.http.get(this.global.api + "ReportTeacher/CodeSummary/" + syear + "?instructorId=" + instructorId + "&departmentF=" + departmentF, this.global.option)
  }

  getOnlineLeavemanagementLeaveCategory() {
    return this.http.get(this.global.api + "OnlineLeaveManagement/CONSTLeaveCategory/", this.global.option)
  }

  getEmployeePortalEmployeeSchedule() {
    return this.http.get(this.global.api + "EmployeePortal/Employee/Schedule", this.global.option)
  }

  getEmployeePortalBasicEdFacultySchedule(schoolYear, employeeId) {
    return this.http.get(this.global.api + "EmployeePortal/BasicEdFaculty/Schedule/" + schoolYear + '/' + employeeId, this.global.option)
  }

  getEmployeePortalCodeSummary(syear) {
    return this.http.get(this.global.api + "EmployeePortal/CodeSummary/" + syear, this.global.option)
  }

  postEmployeePortalLeaveFacultyLeaveDetail(data) {
    return this.http.post(this.global.api + 'EmployeePortalLeave/FacultyLeaveDetail/', data, this.global.option)
  }

  putEmployeePortalLeaveFacultyLeaveDetail(data) {
    return this.http.put(this.global.api + 'EmployeePortalLeave/FacultyLeaveDetail/', data, this.global.option)
  }

  putEmployeePortalLeaveStatusByEmployee(leaveID, LeaveStatusID) {
    return this.http.put(this.global.api + 'EmployeePortalLeave/LeaveStatusByEmployee/' + leaveID + '/' + LeaveStatusID, {}, this.global.option)
  }

  getEmployeePerson(idNumber) {
    return this.http.get(this.global.api + 'Employee/Person/' + idNumber, this.global.option);
  }

  getEmployeePortalLeaveHistory(employeeID, schoolYear) {
    return this.http.get(this.global.api + 'EmployeePortal/Leaves/' + employeeID + '/' + schoolYear, this.global.option)
  }

  getLeaveCredit(employeeID) {
    return this.http.get(this.global.api + 'EmployeePortal/LeaveCredit/' + employeeID, this.global.option)
  }


  getOnlineLeaveManagement() {
    return this.http.get(this.global.api + 'EmployeePortalLeave/Leave/', this.global.option)
  }



  postOLMOnlineLeaveType(leaveID, data) {
    return this.http.post(this.global.api + 'EmployeePortalLeave/OnlineLeaveLeaveType/' + leaveID, data, this.global.option)
  }

  deleteOLMOlineLeaveType(leaveID, LeaveDurationID, LeaveTypeID) {
    return this.http.delete(this.global.api + 'EmployeePortalLeave/OnlineLeaveLeaveType/' + leaveID + '/' + LeaveDurationID + '/' + LeaveTypeID, this.global.option)

  }


  getOLMEmployeePerson() {
    return this.http.get(this.global.api + 'EmployeePortal/Person', this.global.option);

  }


}

