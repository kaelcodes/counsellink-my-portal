import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GlobalService } from '../global.service';
import { CounselLinkApi } from './counsellink.api';
import {
  Appointment, AppointmentStatus, BookingRequest, Counselor, CounselingType,
  HistoryQuery, HistoryResult, OFFICE_HOURS, RescheduleRequest, SLOT_MINUTES,
  StudentProfile, TimeSlot
} from './guidance.models';

/*
  GuidanceService — the ONLY place the Guidance screens call.
  CounselLinkApi handles all HTTP to CounselLink.API; this class is the facade.

  This service is live-only: it always calls CounselLinkApi and uses real API responses.
  A live failure is NEVER silently replaced with mock data — it surfaces as an error
  that the component shows to the student.
*/

@Injectable({ providedIn: 'root' })
export class GuidanceService {
  private profileCache: StudentProfile = null;

  constructor(private global: GlobalService, private api: CounselLinkApi) { }

  // ---------------------------------------------------------------- student profile

  /**
   * Builds StudentProfile from already-loaded GlobalService.studinfo + sy/constSY.
   * No extra network call; no dependency on the missing domain/syear/checknosemester symbols.
   * Falls back to a safe placeholder if studinfo is not yet loaded.
   */
  getStudentProfile(): Observable<StudentProfile> {
    if (this.profileCache) { return of(this.profileCache); }

    const info = this.global.studinfo;
    const id = String(this.global.requestid() || '');
    if (!info || !id) {
      return throwError(new Error('Student information is not loaded yet. Please wait and try again.'));
    }

    // Prefer constSY (locked school year) over sy; fall back gracefully.
    const schoolYear = String(this.global.constSY || this.global.sy || '');

    // Map studinfo fields to StudentProfile.
    // departmentId: studinfo may expose departmentID (number) or departmentCode (string).
    const deptId = String((info as any).departmentID || (info as any).departmentId || '');
    const name = [
      (info as any).firstName, (info as any).middleName, (info as any).lastName
    ].map(x => (x || '').trim()).filter(x => x).join(' ');

    const p: StudentProfile = {
      idNumber: id,
      fullName: name || id,
      course: String(info.course || ''),
      courseCode: String(info.courseCode || ''),
      departmentCode: String(info.departmentCode || ''),
      departmentName: String((info as any).departmentName || info.departmentCode || ''),
      departmentId: deptId,
      yearLevel: +info.yearOrGradeLevel || 0,
      level: String(info.level || 'COLLEGE'),
      enrollmentStatus: String(info.enrollmentStatus || ''),
      schoolYear: schoolYear
    };
    this.profileCache = p;
    return of(p);
  }

  // ------------------------------------------------------ counselor and types

  /** REAL: GET /api/counselor-assignments + GET /api/counselors. */
  getCounselor(departmentCode: string): Observable<Counselor> {
    return this.getStudentProfile().pipe(
      switchMap(p => this.api.getCounselor(p, departmentCode))
    );
  }

  /** REAL: GET /api/constants/AppointmentType. */
  getCounselingTypes(): Observable<CounselingType[]> {
    return this.api.getCounselingTypes();
  }

  /** REAL: GET /api/constants/ConcernType — concern types for the student booking form. */
  getConcernTypes(): Observable<CounselingType[]> {
    return this.api.getConcernTypes();
  }

  // ------------------------------------------------------------------ slots

  /**
   * REAL: GET /api/appointments?SearchEmployeeID=...&SearchStartDate=...&SearchEndDate=...
   *       then derive taken slots client-side (no dedicated slots endpoint in Swagger).
   *       Slot ownership: if the slot's studentId matches the authenticated student's idNumber,
   *       it is marked 'Own'. Otherwise, it is marked 'Unavailable' (displayed as 'Booked').
   *       NEVER expose another student's identifying information — only the slot status.
   *
   * BACKEND DEPENDENCY: Server-side ownership enforcement is required; frontend filtering alone
   * is insufficient. The backend must enforce that students can only access their own appointments.
   */
  getSlots(counselorId: string, date: string): Observable<TimeSlot[]> {
    return this.api.getScheduleAvailability(counselorId, date).pipe(
      map(apiSlots => apiSlots.map(s => ({
        startTime: s.startTime,
        endTime:   s.endTime,
        label:     this.formatTime(s.startTime) + ' - ' + this.formatTime(s.endTime),
        status:    (s.isAvailable ? 'Available' : 'Unavailable') as 'Available' | 'Unavailable'
      })))
    );
  }

  // ----------------------------------------------------------- appointments

  /** REAL: GET /api/appointments?SearchIDNumber=... */
  getHistory(q: HistoryQuery): Observable<HistoryResult> {
    return new Observable(obs => {
      this.getStudentProfile().subscribe(p => {
        this.api.getHistory(p, q).subscribe(r => { obs.next(r); obs.complete(); }, e => obs.error(e));
      }, e => obs.error(e));
    });
  }

  getFollowUpHistory(): Observable<Appointment[]> {
    return this.getStudentProfile().pipe(
      switchMap(p => this.api.getFollowUpHistory(p))
    );
  }

  /**
   * The student's first active appointment (Pending or Approved), or null.
   * Used to drive the activity indicator and color dot in MainComponent.
   */
  getPending(): Observable<Appointment> {
    return new Observable(obs => {
      this.getStudentProfile().subscribe(p => {
        this.api.getPending(p).subscribe(a => { obs.next(a); obs.complete(); }, e => obs.error(e));
      }, e => obs.error(e));
    });
  }

  /** Reuses the normal booking Pending/Approved restriction for draft submissions. */
  hasPendingAppointment(): Observable<boolean> {
    return new Observable(obs => {
      this.getStudentProfile().subscribe(p => {
        this.api.hasPendingAppointment(p).subscribe(
          blocked => { obs.next(blocked); obs.complete(); },
          e => obs.error(e)
        );
      }, e => obs.error(e));
    });
  }

  /** REAL: POST /api/appointments. */
  book(req: BookingRequest): Observable<Appointment> {
    return new Observable(obs => {
      this.getStudentProfile().subscribe(p => {
        this.api.book(p, req).subscribe(a => { obs.next(a); obs.complete(); }, e => obs.error(e));
      }, e => obs.error(e));
    });
  }

  /**
   * REAL: POST /api/appointments/{id}/reschedule (RescheduleDto).
   * Allowed for BOTH 'Pending' AND 'Approved' appointments.
   * A live failure surfaces as an error — it is never silently replaced with mock success.
   */
  reschedule(id: number, req: RescheduleRequest): Observable<Appointment> {
    return new Observable(obs => {
      this.getStudentProfile().subscribe(p => {
        this.api.reschedule(p, id, req).subscribe(a => { obs.next(a); obs.complete(); }, e => obs.error(e));
      }, e => obs.error(e));
    });
  }

  /** Student follow-up reschedule: creates a request requiring counselor approval. */
  requestFollowUpReschedule(id: number, req: RescheduleRequest, note: string): Observable<any> {
    return this.getStudentProfile().pipe(
      switchMap(p => this.api.requestFollowUpReschedule(p, id, req.date, req.startTime, req.endTime, note))
    );
  }

  /** Update concern type and reason while preserving the appointment's current status. */
  updateConcernDetails(id: number, concernTypeId: string, concernDescription: string): Observable<Appointment> {
    return this.api.updateConcernDetails(id, concernTypeId, concernDescription);
  }

  /**
   * Confirm an 'Approved' appointment.
   * LIVE: calls PUT /api/appointments/{id}/student-confirm.
   * After success, sends a student notification via POST /api/notifications.
   * NOTE: Counselor notification is NOT supported by the current API schema (NotificationDto
   * has only idNumber, not employeeID). This is documented as a backend dependency.
   */
  studentConfirm(id: number): Observable<Appointment> {
    return new Observable(obs => {
      this.getStudentProfile().subscribe(p => {
        this.api.studentConfirm(p, id).subscribe(
          a => {
            // Send student notification. Counselor notification is not supported by the API schema.
            const content = 'Your appointment on ' + a.date + ' at ' + a.startTime + ' has been confirmed by the student.';
            this.api.sendStudentNotification(p, content).subscribe(
              () => { obs.next(a); obs.complete(); },
              () => {
                // Notification failure is non-fatal: confirmation succeeded
                console.warn('[GuidanceService] Student notification could not be sent after confirm.');
                obs.next(a);
                obs.complete();
              }
            );
          },
          e => obs.error(e)
        );
      }, e => obs.error(e));
    });
  }

  /**
   * Confirm a counselor-initiated Pending appointment via PUT /api/appointments/{id}/confirm.
   */
  confirmCounselorInitiated(appointment: Appointment): Observable<Appointment> {
    return this.getStudentProfile().pipe(
      switchMap(p => this.api.counselorConfirm(p, appointment))
    );
  }

  /**
   * Accept a counselor-proposed reschedule.
   * LIVE: PUT /api/appointments/{id}/accept-reschedule → body: { idNumber }.
   * A live failure is never silently replaced with mock success.
   */
  acceptReschedule(id: number): Observable<Appointment> {
    return new Observable(obs => {
      this.getStudentProfile().subscribe(p => {
        this.api.acceptReschedule(p, id).subscribe(
          a => { obs.next(a); obs.complete(); },
          e => obs.error(e)
        );
      }, e => obs.error(e));
    });
  }

  /**
   * Delete an appointment.
   * LIVE: DELETE /api/appointments/{id} (path id only, no body).
   */
  deleteAppointment(id: number): Observable<any> {
    return this.api.deleteAppointment(id);
  }

  /**
   * Send a notification to the student.
   * LIVE: calls POST /api/notifications with the student's idNumber.
   * NOTE: Counselor notifications are NOT supported — NotificationDto has no employeeID field.
   * BACKEND DEPENDENCY: To notify counselors, the backend must add employeeID to NotificationDto
   * or provide a separate counselor notification endpoint.
   */
  sendNotification(content: string): Observable<any> {
    return new Observable(obs => {
      this.getStudentProfile().subscribe(p => {
        this.api.sendStudentNotification(p, content).subscribe(
          r => { obs.next(r); obs.complete(); }, e => obs.error(e)
        );
      }, e => obs.error(e));
    });
  }

  /**
   * Get count of unread notifications for the authenticated student.
   * LIVE: GET /api/notifications?SearchIDNumber=...&SearchStatus=false
   */
  getUnreadNotificationCount(): Observable<number> {
    return new Observable(obs => {
      this.getStudentProfile().subscribe(p => {
        this.api.getUnreadNotifications(p).subscribe(
          n => { obs.next(n); obs.complete(); }, e => obs.error(e)
        );
      }, e => obs.error(e));
    });
  }

  // ---------------------------------------------------------- date and time helpers

  /** Today as 'YYYY-MM-DD' using the server date from GlobalService (avoids wrong device clock). */
  today(): string {
    const s = this.global.serverdate;   // 'mm/dd/yyyy'
    if (s) { const p = s.split('/'); return p[2] + '-' + p[0] + '-' + p[1]; }
    return this.toIso(new Date());
  }

  isWeekend(iso: string): boolean {
    const day = this.parseIso(iso).getDay();
    return day === 0 || day === 6;
  }

  formatTime(t: string): string {
    const m = this.toMin(t), h = Math.floor(m / 60), mm = m % 60;
    return (h % 12 === 0 ? 12 : h % 12) + ':' + this.pad(mm) + ' ' + (h >= 12 ? 'PM' : 'AM');
  }

  private daySlots(): { start: string, end: string }[] {
    const out: { start: string, end: string }[] = [];
    OFFICE_HOURS.forEach(block => {
      let t = this.toMin(block.start);
      const end = this.toMin(block.end);
      while (t < end) {
        const e = Math.min(t + SLOT_MINUTES, end);
        out.push({ start: this.fromMin(t), end: this.fromMin(e) });
        t = e;
      }
    });
    return out;
  }

  private toMin(t: string): number { const p = t.split(':'); return (+p[0]) * 60 + (+p[1]); }
  private fromMin(m: number): string { return this.pad(Math.floor(m / 60)) + ':' + this.pad(m % 60); }
  private pad(n: number): string { return n < 10 ? '0' + n : '' + n; }
  private toIso(d: Date): string { return d.getFullYear() + '-' + this.pad(d.getMonth() + 1) + '-' + this.pad(d.getDate()); }
  private parseIso(s: string): Date { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
}
