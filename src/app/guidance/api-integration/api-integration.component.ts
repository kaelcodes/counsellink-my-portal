import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CounselLinkIntegrationService,
  CreateAppointmentDto,
  UpdateAppointmentDto
} from '../counsellink-integration.service';
import { GlobalService } from '../../global.service';

@Component({
  selector: 'app-api-integration',
  templateUrl: './api-integration.component.html',
  styleUrls: ['./api-integration.component.scss']
})
export class ApiIntegrationComponent implements OnInit {
  useMock = true;
  modeNotice = '';
  connectionStatus = 'idle';
  selectedTab = 0;

  apptColumns = ['appointmentID', 'idNumber', 'employeeID', 'appointmentDate', 'appointmentTime', 'appointmentTypeID', 'appointmentStatusID', 'concernTypeID'];
  reschedColumns = ['appointmentID', 'idNumber', 'employeeID', 'newStartDate', 'rescheduleNote'];
  notifColumns = ['notificationID', 'idNumber', 'content', 'notificationStatus'];
  assignColumns = ['assignmentID', 'employeeID', 'departmentID', 'programID', 'yearOrGradeLevel', 'schoolYear'];

  // Appointment tab
  myAppointmentIDNumber = '';
  appointmentResults: any[] = [];
  appointmentLoading = false;
  appointmentError = '';
  appointmentRawResponse: any = null;

  counselorSearchEmployeeID = '';
  counselorAppointmentResults: any[] = [];
  counselorLoading = false;
  counselorError = '';
  counselorRawResponse: any = null;

  searchApptID: number | null = null;
  searchGradeOrYear: number | null = null;
  searchProgram = '';
  searchStartDate = '';
  searchEndDate = '';
  searchApptTime = '';
  searchApptTypeID: number | null = null;
  searchConcernTypeID: number | null = null;
  searchStatusID: number | null = null;
  searchAttendanceID: number | null = null;
  searchReferredBy = '';
  searchReferralStart = '';
  searchReferralEnd = '';
  searchResults: any[] = [];
  searchLoading = false;
  searchError = '';
  searchRawResponse: any = null;

  reschedHistEmpID = '';
  reschedHistResults: any[] = [];
  reschedHistLoading = false;
  reschedHistError = '';
  reschedHistRawResponse: any = null;

  // Notification tab
  notifSearchID: number | null = null;
  notifSearchIDNumber = '';
  notifSearchStatus = '';
  notifResults: any[] = [];
  notifLoading = false;
  notifError = '';
  notifRawResponse: any = null;
  newNotifIDNumber = '';
  newNotifContent = '';
  newNotifStatus = false;
  notifPostLoading = false;
  notifPostError = '';
  notifPostResult: any = null;
  notifPostConfirmPending = false;

  // Counselor Assignments tab
  assignmentResults: any[] = [];
  assignmentLoading = false;
  assignmentError = '';
  assignmentRawResponse: any = null;
  newAssignEmployeeID = '';
  newAssignDepartmentID = '';
  newAssignProgramID = '';
  newAssignYearLevel: number | null = null;
  newAssignSchoolYear = '';
  assignPostLoading = false;
  assignPostError = '';
  assignPostResult: any = null;
  assignPostConfirmPending = false;

  // Appointment Actions tab
  selectedAction = 'confirm';
  actionApptID: number | null = null;
  actionEmployeeID = '';
  actionConfirmedDate = '';
  actionConfirmedTime = '';
  actionIDNumber = '';
  actionNewStartDate = '';
  actionNewEndDate = '';
  actionReschedNote = '';
  actionCreateDto: CreateAppointmentDto = { idNumber: '' };
  actionUpdateDto: UpdateAppointmentDto = {};
  actionLoading = false;
  actionError = '';
  actionResult: any = null;
  actionRawResponse: any = null;
  actionConfirmPending = false;

  constructor(private svc: CounselLinkIntegrationService, public global: GlobalService) {}

  ngOnInit() {
    const id = this.global.requestid();
    if (id) { this.myAppointmentIDNumber = id; }
  }

  switchMode(mock: boolean) {
    this.useMock = mock;
    this.svc.useMock = mock;
    this.modeNotice = mock
      ? 'Switched to Mock Mode. Previous results cleared.'
      : 'Switched to Live API Mode. Previous results cleared.';
    this.connectionStatus = 'idle';
    // Clear all state
    this.appointmentResults = []; this.appointmentError = ''; this.appointmentRawResponse = null;
    this.counselorAppointmentResults = []; this.counselorError = ''; this.counselorRawResponse = null;
    this.searchResults = []; this.searchError = ''; this.searchRawResponse = null;
    this.reschedHistResults = []; this.reschedHistError = ''; this.reschedHistRawResponse = null;
    this.notifResults = []; this.notifError = ''; this.notifRawResponse = null;
    this.notifPostResult = null; this.notifPostError = '';
    this.assignmentResults = []; this.assignmentError = ''; this.assignmentRawResponse = null;
    this.assignPostResult = null; this.assignPostError = '';
    this.actionResult = null; this.actionError = ''; this.actionRawResponse = null;
    this.notifPostConfirmPending = false;
    this.assignPostConfirmPending = false;
    this.actionConfirmPending = false;
  }

  checkHealth() {
    this.connectionStatus = 'checking';
    this.svc.checkHealth().subscribe(
      (res: any) => { this.connectionStatus = 'connected'; },
      (err: any) => { this.connectionStatus = 'unreachable'; }
    );
  }

  /**
   * Extracts and normalizes appointment rows from the live API response.
   *
   * The live API returns { value: [...], Count: N } — not a bare array.
   * Array.isArray(res) is therefore false and would yield [] without this helper.
   *
   * Normalization maps PascalCase API property names to the camelCase names
   * expected by the table column definitions (appointmentID, idNumber, etc.).
   * Mock data already uses camelCase, so this path is only needed for live rows.
   *
   * rawResponse is always assigned BEFORE this method is called, so the Raw
   * Response panel retains the original { value: [...], Count: N } envelope.
   *
   * TypeScript 3.5.3-compatible: no ?? operator, no optional chaining.
   */
  private extractAppointments(res: any): any[] {
    // Unwrap { value: [...], Count: N } envelope returned by the live API.
    const rows: any[] = Array.isArray(res) ? res
      : (res && Array.isArray(res.value)) ? res.value
      : [];
    return rows.map((r: any) => {
      // If the row already has camelCase keys (mock data), return it unchanged.
      if (r.appointmentID !== undefined) { return r; }
      // Map PascalCase live API keys to the camelCase names the table uses.
      return {
        appointmentID:       r['AppointmentID'],
        idNumber:            r['IDNumber'],
        employeeID:          r['EmployeeID'],
        appointmentDate:     r['AppointmentDate'],
        appointmentTime:     r['AppointmentTime'],
        appointmentTypeID:   r['AppointmentTypeID'],
        appointmentStatusID: r['AppointmentStatusID'],
        concernTypeID:       r['ConcernTypeID'],
        concernDescription:  r['ConcernDescription'],
        gradeOrYearLevel:    r['GradeOrYearLevel'],
        programOrCourse:     r['ProgramOrCourse'],
        referredBy:          r['ReferredBy'],
        attendanceStatusID:  r['AttendanceStatusID'],
        rescheduleNote:      r['RescheduleNote'],
        concernType:         r['ConcernType']
      };
    });
  }

  fetchMyAppointments() {
    this.appointmentLoading = true;
    this.appointmentError = '';
    this.svc.getAppointments({ SearchIDNumber: this.myAppointmentIDNumber }).subscribe(
      (res: any) => {
        this.appointmentLoading = false;
        this.appointmentRawResponse = res;                        // full envelope preserved
        this.appointmentResults = this.extractAppointments(res);  // normalized rows for table
      },
      (err: any) => {
        this.appointmentLoading = false;
        this.appointmentError = err && err.message ? err.message : String(err);
        this.appointmentRawResponse = { error: this.appointmentError };
      }
    );
  }

  fetchCounselorAppointments() {
    this.counselorLoading = true;
    this.counselorError = '';
    this.svc.getAppointments({ SearchEmployeeID: this.counselorSearchEmployeeID }).subscribe(
      (res: any) => {
        this.counselorLoading = false;
        this.counselorRawResponse = res;                                  // full envelope preserved
        this.counselorAppointmentResults = this.extractAppointments(res); // normalized rows for table
      },
      (err: any) => {
        this.counselorLoading = false;
        this.counselorError = err && err.message ? err.message : String(err);
        this.counselorRawResponse = { error: this.counselorError };
      }
    );
  }

  searchAppointments() {
    const params: { [k: string]: any } = {};
    if (this.searchApptID != null) { params.SearchAppointmentID = this.searchApptID; }
    if (this.searchGradeOrYear != null) { params.SearchGradeOrYear = this.searchGradeOrYear; }
    if (this.searchProgram) { params.SearchProgram = this.searchProgram; }
    if (this.searchStartDate) { params.SearchStartDate = this.searchStartDate; }
    if (this.searchEndDate) { params.SearchEndDate = this.searchEndDate; }
    if (this.searchApptTime) { params.SearchAppointmentTime = this.searchApptTime; }
    if (this.searchApptTypeID != null) { params.SearchAppointmentTypeID = this.searchApptTypeID; }
    if (this.searchConcernTypeID != null) { params.SearchConcernTypeID = this.searchConcernTypeID; }
    if (this.searchStatusID != null) { params.SearchStatusID = this.searchStatusID; }
    if (this.searchAttendanceID != null) { params.SearchAttendanceID = this.searchAttendanceID; }
    if (this.searchReferredBy) { params.SearchReferredBy = this.searchReferredBy; }
    if (this.searchReferralStart) { params.SearchReferralStart = this.searchReferralStart; }
    if (this.searchReferralEnd) { params.SearchReferralEnd = this.searchReferralEnd; }
    this.searchLoading = true;
    this.searchError = '';
    this.svc.getAppointments(params).subscribe(
      (res: any) => {
        this.searchLoading = false;
        this.searchRawResponse = res;                         // full envelope preserved
        this.searchResults = this.extractAppointments(res);   // normalized rows for table
      },
      (err: any) => {
        this.searchLoading = false;
        this.searchError = err && err.message ? err.message : String(err);
        this.searchRawResponse = { error: this.searchError };
      }
    );
  }

  fetchRescheduleHistory() {
    this.reschedHistLoading = true;
    this.reschedHistError = '';
    this.svc.getRescheduleHistory(this.reschedHistEmpID).subscribe(
      (res: any) => {
        this.reschedHistLoading = false;
        this.reschedHistResults = Array.isArray(res) ? res : [];
        this.reschedHistRawResponse = res;
      },
      (err: any) => {
        this.reschedHistLoading = false;
        this.reschedHistError = err && err.message ? err.message : String(err);
        this.reschedHistRawResponse = { error: this.reschedHistError };
      }
    );
  }

  fetchNotifications() {
    const params: { [k: string]: any } = {};
    if (this.notifSearchID != null) { params.SearchNotificationID = this.notifSearchID; }
    if (this.notifSearchIDNumber) { params.SearchIDNumber = this.notifSearchIDNumber; }
    if (this.notifSearchStatus !== '') { params.SearchStatus = this.notifSearchStatus; }
    this.notifLoading = true;
    this.notifError = '';
    this.svc.getNotifications(params).subscribe(
      (res: any) => {
        this.notifLoading = false;
        this.notifResults = Array.isArray(res) ? res : [];
        this.notifRawResponse = res;
      },
      (err: any) => {
        this.notifLoading = false;
        this.notifError = err && err.message ? err.message : String(err);
        this.notifRawResponse = { error: this.notifError };
      }
    );
  }

  submitNotification() {
    if (!this.useMock && !this.notifPostConfirmPending) { return; }
    this.notifPostLoading = true;
    this.notifPostError = '';
    this.notifPostResult = null;
    this.notifPostConfirmPending = false;
    this.svc.createNotification({
      notificationID: 0,
      idNumber: this.newNotifIDNumber,
      content: this.newNotifContent,
      notificationStatus: this.newNotifStatus
    }).subscribe(
      (res: any) => { this.notifPostLoading = false; this.notifPostResult = res; },
      (err: any) => { this.notifPostLoading = false; this.notifPostError = err && err.message ? err.message : String(err); }
    );
  }

  fetchAssignments() {
    this.assignmentLoading = true;
    this.assignmentError = '';
    this.svc.getCounselorAssignments().subscribe(
      (res: any) => {
        this.assignmentLoading = false;
        this.assignmentResults = Array.isArray(res) ? res : [];
        this.assignmentRawResponse = res;
      },
      (err: any) => {
        this.assignmentLoading = false;
        this.assignmentError = err && err.message ? err.message : String(err);
        this.assignmentRawResponse = { error: this.assignmentError };
      }
    );
  }

  submitAssignment() {
    if (!this.useMock && !this.assignPostConfirmPending) { return; }
    this.assignPostLoading = true;
    this.assignPostError = '';
    this.assignPostResult = null;
    this.assignPostConfirmPending = false;
    this.svc.createCounselorAssignment({
      assignmentID: 0,
      employeeID: this.newAssignEmployeeID,
      departmentID: this.newAssignDepartmentID || null,
      programID: this.newAssignProgramID || null,
      yearOrGradeLevel: this.newAssignYearLevel,
      schoolYear: this.newAssignSchoolYear || null
    }).subscribe(
      (res: any) => { this.assignPostLoading = false; this.assignPostResult = res; },
      (err: any) => { this.assignPostLoading = false; this.assignPostError = err && err.message ? err.message : String(err); }
    );
  }

  executeAction() {
    if (!this.useMock && !this.actionConfirmPending) { return; }
    this.actionLoading = true;
    this.actionError = '';
    this.actionResult = null;
    this.actionRawResponse = null;
    this.actionConfirmPending = false;
    let call: Observable<any>;
    const id = this.actionApptID || 0;
    switch (this.selectedAction) {
      case 'confirm':
        call = this.svc.confirmAppointment(id, {
          employeeID: this.actionEmployeeID,
          confirmedDate: this.actionConfirmedDate || null,
          confirmedTime: this.actionConfirmedTime || null
        });
        break;
      case 'student-confirm':
        call = this.svc.studentConfirmAppointment(id, { idNumber: this.actionIDNumber });
        break;
      case 'complete':
        call = this.svc.completeAppointment(id);
        break;
      case 'reschedule':
        call = this.svc.rescheduleAppointment(id, {
          newStartDate: this.actionNewStartDate,
          newEndDate: this.actionNewEndDate,
          rescheduleNote: this.actionReschedNote
        });
        break;
      case 'accept-reschedule':
        call = this.svc.acceptReschedule(id, { idNumber: this.actionIDNumber });
        break;
      case 'no-show':
        call = this.svc.noShowAppointment(id);
        break;
      case 'create':
        call = this.svc.createAppointment(this.actionCreateDto);
        break;
      case 'update':
        call = this.svc.updateAppointment(id, this.actionUpdateDto);
        break;
      case 'delete':
        call = this.svc.deleteAppointment(id);
        break;
      default:
        this.actionLoading = false;
        this.actionError = 'Unknown action.';
        return;
    }
    call.subscribe(
      (res: any) => {
        this.actionLoading = false;
        this.actionResult = res;
        this.actionRawResponse = res;
      },
      (err: any) => {
        this.actionLoading = false;
        this.actionError = err && err.message ? err.message : String(err);
        this.actionRawResponse = { error: this.actionError };
      }
    );
  }

  getActionLabel(action: string): string {
    const labelMap: { [k: string]: string } = {
      'confirm': 'Confirm Appointment',
      'student-confirm': 'Student Confirm',
      'complete': 'Complete',
      'reschedule': 'Reschedule',
      'accept-reschedule': 'Accept Reschedule',
      'no-show': 'No-Show',
      'create': 'Create Appointment',
      'update': 'Update Appointment',
      'delete': 'Delete Appointment'
    };
    return labelMap[action] || action;
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  jsonStringify(val: any): string {
    try { return JSON.stringify(val, null, 2); } catch (e) { return String(val); }
  }
}
