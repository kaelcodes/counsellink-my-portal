import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { GlobalService } from '../global.service';

const BASE_URL = 'https://dave55-001-site1.etempurl.com';

export interface CreateAppointmentDto {
  idNumber: string;
  gradeOrYearLevel?: number | null;
  programOrCourse?: string | null;
  employeeID?: string | null;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
  appointmentTypeID?: number | null;
  appointmentStatusID?: number | null;
  attendanceStatusID?: number | null;
  concernTypeID?: number | null;
  concernDescription?: string | null;
  referredBy?: string | null;
  referralDate?: string | null;
}

export interface UpdateAppointmentDto {
  appointmentStatusID?: number;
  attendanceStatusID?: number;
  rescheduleNote?: string | null;
  concernDescription?: string | null;
  concernTypeID?: number | null;
}

export interface ConfirmAppointmentDto {
  employeeID: string;
  confirmedDate?: string | null;
  confirmedTime?: string | null;
}

export interface NotificationDto {
  notificationID: number;
  idNumber: string;
  content?: string | null;
  notificationStatus?: boolean;
}

export interface CounselorAssignmentDto {
  assignmentID: number;
  employeeID: string;
  departmentID?: string | null;
  programID?: string | null;
  yearOrGradeLevel?: number | null;
  schoolYear?: string | null;
}

export interface RescheduleDto {
  newStartDate: string;
  newEndDate: string;
  rescheduleNote: string;
}

@Injectable({ providedIn: 'root' })
export class CounselLinkIntegrationService {
  useMock = true;

  constructor(private http: Http, private global: GlobalService) {}

  private buildOptions(): RequestOptions {
    const base: any = this.global.option || {};
    const h = new Headers();
    try {
      if (base.headers && base.headers.keys) {
        base.headers.keys().forEach((k: string) => h.set(k, base.headers.get(k)));
      }
    } catch (e) { /* fall through */ }
    h.set('Content-Type', 'application/json');
    return new RequestOptions({ headers: h });
  }

  private buildUrl(path: string, params?: { [k: string]: any }): string {
    let q = '';
    if (params) {
      const parts = Object.keys(params)
        .filter(k => params[k] !== null && params[k] !== undefined && params[k] !== '')
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
      if (parts.length) { q = '?' + parts.join('&'); }
    }
    return BASE_URL + '/' + path + q;
  }

  private liveGet(path: string, params?: { [k: string]: any }): Observable<any> {
    return this.http.get(this.buildUrl(path, params), this.buildOptions()).pipe(
      timeout(15000),
      map(r => { try { return r.json(); } catch (e) { return r.text(); } }),
      catchError(e => { throw new Error(this.friendlyError(e)); })
    );
  }

  private liveSend(method: 'post' | 'put' | 'delete', path: string, body?: any): Observable<any> {
    const u = this.buildUrl(path);
    const opts = this.buildOptions();
    const call = method === 'delete' ? this.http.delete(u, opts)
      : method === 'put' ? this.http.put(u, JSON.stringify(body || {}), opts)
      : this.http.post(u, JSON.stringify(body || {}), opts);
    return call.pipe(
      timeout(15000),
      map(r => { try { return r.json(); } catch (e) { return r.text(); } }),
      catchError(e => { throw new Error(this.friendlyError(e)); })
    );
  }

  private friendlyError(e: any): string {
    if (e && e.name === 'TimeoutError') { return 'Request timed out. Please try again.'; }
    if (e && e.status === 0) { return 'Cannot reach the server. Check your connection.'; }
    if (e instanceof Error) { return e.message; }
    try { const b = e.json ? e.json() : null; if (b && b.message) { return b.message; } } catch (x) { /* */ }
    return 'An error occurred. Please try again.';
  }

  private mockOk(): any {
    return { success: true, message: '[MOCK DATA] Operation simulated successfully.', timestamp: new Date().toISOString() };
  }

  private mockAppointments(): any[] {
    return [
      { appointmentID: 1001, idNumber: '2023001', employeeID: 'EMP-1001', appointmentDate: '2026-10-10', appointmentTime: '08:30:00', appointmentTypeID: 1, appointmentStatusID: 1, concernTypeID: 2, concernDescription: 'Academic stress', referredBy: null },
      { appointmentID: 1002, idNumber: '2023002', employeeID: 'EMP-1001', appointmentDate: '2026-10-12', appointmentTime: '10:00:00', appointmentTypeID: 1, appointmentStatusID: 2, concernTypeID: 3, concernDescription: 'Career guidance', referredBy: null },
      { appointmentID: 1003, idNumber: '2023003', employeeID: 'EMP-1002', appointmentDate: '2026-10-14', appointmentTime: '13:00:00', appointmentTypeID: 2, appointmentStatusID: 3, concernTypeID: 1, concernDescription: 'Personal issues', referredBy: 'Prof. Santos' },
      { appointmentID: 1004, idNumber: '2023004', employeeID: 'EMP-1002', appointmentDate: '2026-10-16', appointmentTime: '09:00:00', appointmentTypeID: 1, appointmentStatusID: 4, concernTypeID: 2, concernDescription: 'Rescheduled appointment', referredBy: null },
      { appointmentID: 1005, idNumber: '2023005', employeeID: 'EMP-1001', appointmentDate: '2026-10-18', appointmentTime: '11:00:00', appointmentTypeID: 2, appointmentStatusID: 5, concernTypeID: 4, concernDescription: 'No-show student', referredBy: null }
    ];
  }

  getAppointments(params: any): Observable<any> {
    if (this.useMock) { return of(this.mockAppointments()); }
    return this.liveGet('api/appointments', params);
  }

  createAppointment(body: CreateAppointmentDto): Observable<any> {
    if (this.useMock) { return of(this.mockOk()); }
    return this.liveSend('post', 'api/appointments', body);
  }

  updateAppointment(id: number, body: UpdateAppointmentDto): Observable<any> {
    if (this.useMock) { return of(this.mockOk()); }
    return this.liveSend('put', 'api/appointments/' + id, body);
  }

  deleteAppointment(id: number): Observable<any> {
    if (this.useMock) { return of(this.mockOk()); }
    return this.liveSend('delete', 'api/appointments/' + id);
  }

  confirmAppointment(id: number, body: ConfirmAppointmentDto): Observable<any> {
    if (this.useMock) { return of(this.mockOk()); }
    return this.liveSend('put', 'api/appointments/' + id + '/confirm', body);
  }

  studentConfirmAppointment(id: number, body: { idNumber: string }): Observable<any> {
    if (this.useMock) { return of(this.mockOk()); }
    return this.liveSend('put', 'api/appointments/' + id + '/student-confirm', body);
  }

  completeAppointment(id: number): Observable<any> {
    if (this.useMock) { return of(this.mockOk()); }
    return this.liveSend('put', 'api/appointments/' + id + '/complete');
  }

  rescheduleAppointment(id: number, body: RescheduleDto): Observable<any> {
    if (this.useMock) { return of(this.mockOk()); }
    return this.liveSend('post', 'api/appointments/' + id + '/reschedule', body);
  }

  acceptReschedule(id: number, body: { idNumber: string }): Observable<any> {
    if (this.useMock) { return of(this.mockOk()); }
    return this.liveSend('put', 'api/appointments/' + id + '/accept-reschedule', body);
  }

  noShowAppointment(id: number): Observable<any> {
    if (this.useMock) { return of(this.mockOk()); }
    return this.liveSend('put', 'api/appointments/' + id + '/no-show');
  }

  getRescheduleHistory(employeeId: string): Observable<any> {
    if (this.useMock) {
      return of([
        { appointmentID: 1004, idNumber: '2023004', employeeID: 'EMP-1002', originalDate: '2026-10-14', newStartDate: '2026-10-16T09:00:00', newEndDate: '2026-10-16T09:45:00', rescheduleNote: '[MOCK DATA] Counselor unavailable on original date.' },
        { appointmentID: 1002, idNumber: '2023002', employeeID: 'EMP-1001', originalDate: '2026-10-10', newStartDate: '2026-10-12T10:00:00', newEndDate: '2026-10-12T10:45:00', rescheduleNote: '[MOCK DATA] Student requested reschedule.' }
      ]);
    }
    return this.liveGet('api/appointments/reschedule-history', { employeeId: employeeId });
  }

  getNotifications(params: any): Observable<any> {
    if (this.useMock) {
      return of([
        { notificationID: 7001, idNumber: '2023001', content: '[MOCK DATA] Your appointment on Oct 10 is confirmed.', notificationStatus: true },
        { notificationID: 7002, idNumber: '2023001', content: '[MOCK DATA] Reminder: appointment tomorrow at 8:30 AM.', notificationStatus: false },
        { notificationID: 7003, idNumber: '2023002', content: '[MOCK DATA] Your rescheduled appointment has been accepted.', notificationStatus: false }
      ]);
    }
    return this.liveGet('api/notifications', params);
  }

  createNotification(body: NotificationDto): Observable<any> {
    if (this.useMock) { return of(this.mockOk()); }
    return this.liveSend('post', 'api/notifications', body);
  }

  getCounselorAssignments(): Observable<any> {
    if (this.useMock) {
      return of([
        { assignmentID: 1, employeeID: 'EMP-1001', departmentID: 'SACE', programID: 'BSIT', yearOrGradeLevel: 4, schoolYear: '2026-08-01' },
        { assignmentID: 2, employeeID: 'EMP-1002', departmentID: 'HS', programID: null, yearOrGradeLevel: null, schoolYear: '2026-08-01' }
      ]);
    }
    return this.liveGet('api/counselor-assignments');
  }

  createCounselorAssignment(body: CounselorAssignmentDto): Observable<any> {
    if (this.useMock) { return of(this.mockOk()); }
    return this.liveSend('post', 'api/counselor-assignments', body);
  }

  checkHealth(): Observable<any> {
    if (this.useMock) {
      return of({ status: 'Healthy', timestamp: new Date().toISOString(), mode: '[MOCK DATA]' });
    }
    return this.liveGet('health');
  }
}
