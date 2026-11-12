import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
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

  useMock = true  → mock data (safe, offline-friendly, no live API needed)
  useMock = false → real CounselLinkApi calls; switch once the team confirms:
                    (1) CounselLink.API base URL set in environment.counsellinkApi,
                    (2) CORS/Cloudflare cleared, (3) Bearer JWT accepted,
                    (4) student ownership/authorization confirmed.

  IMPORTANT: a live failure is NEVER silently replaced with mock data.
             It surfaces as an error that the component shows to the student.
*/

const MOCK_COUNSELING_TYPES: CounselingType[] = [
  { id: '1', name: 'Academic Concerns' },
  { id: '2', name: 'Personality/Behavioral Issues' },
  { id: '3', name: 'Family Issues/ Concerns' },
  { id: '4', name: 'Peer Issues/ Concerns' },
  { id: '5', name: 'Relationship Concerns' },
  { id: '6', name: 'Career/ Placement Concerns' },
  { id: '7', name: 'Mental Health Concerns' },
  { id: '8', name: 'Others' }
];

@Injectable({ providedIn: 'root' })
export class GuidanceService {
  /**
   * Master mock switch. Set to false only after the backend team has confirmed:
   *   - environment.counsellinkApi base URL is set
   *   - CORS origin is whitelisted / Cloudflare tunnel is configured
   *   - CounselLink.API accepts the portal Bearer JWT
   *   - Student authorization/ownership is enforced server-side
   */
  useMock = true;

  private profileCache: StudentProfile = null;
  private mockStore: Appointment[] = [];
  private mockNextId = 1;

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

  /** REAL: GET /api/counselor-assignments + GET /api/counselors  |  MOCK: placeholder. */
  getCounselor(departmentCode: string): Observable<Counselor> {
    if (this.useMock) {
      return of({
        id: 'C-' + departmentCode,
        name: 'Guidance Counselor (' + departmentCode + ')',
        departmentCode: departmentCode
      }).pipe(delay(150));
    }
    return this.getStudentProfile().pipe(
      // CounselLinkApi.getCounselor needs the full profile + departmentCode
      (profile$) => {
        // switchMap-free flat approach: share the profile already loaded
        const p = this.profileCache;
        if (!p) { return throwError(new Error('Profile not loaded.')); }
        return this.api.getCounselor(p, departmentCode);
      }
    );
  }

  /** REAL: GET /api/constants/AppointmentType  |  MOCK: fixed list. */
  getCounselingTypes(): Observable<CounselingType[]> {
    if (this.useMock) { return of(MOCK_COUNSELING_TYPES).pipe(delay(150)); }
    return this.api.getCounselingTypes();
  }

  // ------------------------------------------------------------------ slots

  /**
   * REAL: GET /api/appointments?SearchEmployeeID=...&SearchStartDate=...&SearchEndDate=...
   *       then derive taken slots client-side (no dedicated slots endpoint in Swagger).
   *       Slot ownership: if the slot's studentId matches the authenticated student's idNumber,
   *       it is marked 'Own'. Otherwise, it is marked 'Unavailable' (displayed as 'Booked').
   *       NEVER expose another student's identifying information — only the slot status.
   * MOCK: deterministic hash + local store, with ownStudentId for 'Own' detection.
   *
   * BACKEND DEPENDENCY: Server-side ownership enforcement is required; frontend filtering alone
   * is insufficient. The backend must enforce that students can only access their own appointments.
   */
  getSlots(counselorId: string, date: string): Observable<TimeSlot[]> {
    const ownId = String(this.global.requestid() || '');
    if (this.useMock) {
      if (this.isWeekend(date) || date < this.today()) { return of([]); }
      const slots = this.daySlots().map(s => {
        // Check if student's own appointment occupies this slot
        const isOwn = this.mockStore.some(a =>
          a.status !== 'Rescheduled' &&
          a.studentId === ownId &&
          a.counselorId === counselorId &&
          a.date === date &&
          a.startTime === s.start
        );
        if (isOwn) {
          return { startTime: s.start, endTime: s.end, label: this.formatTime(s.start) + ' - ' + this.formatTime(s.end), status: 'Own' as 'Own' };
        }
        // Check if another student (simulated by hash) or another mock appointment occupies this slot
        const otherTaken = this.mockStore.some(a =>
          a.id !== -1 && a.status !== 'Rescheduled' &&
          a.studentId !== ownId &&
          a.counselorId === counselorId &&
          a.date === date &&
          a.startTime === s.start
        ) || this.mockHash(counselorId + '|' + date + '|' + s.start) % 4 === 0;
        return {
          startTime: s.start, endTime: s.end,
          label: this.formatTime(s.start) + ' - ' + this.formatTime(s.end),
          status: (otherTaken ? 'Unavailable' : 'Available') as 'Available' | 'Unavailable'
        };
      });
      return of(slots).pipe(delay(200));
    }
    return new Observable(obs => {
      this.api.getTakenSlotDetails(counselorId, date).subscribe(
        taken => {
          const slots: TimeSlot[] = this.daySlots().map(s => {
            const match = taken.find(t => t.startTime === s.start);
            let status: 'Available' | 'Unavailable' | 'Own' = 'Available';
            if (match) {
              // If the slot belongs to the authenticated student, mark as 'Own'
              status = (ownId && match.studentId === ownId) ? 'Own' : 'Unavailable';
            }
            return {
              startTime: s.start, endTime: s.end,
              label: this.formatTime(s.start) + ' - ' + this.formatTime(s.end),
              status: status
            };
          });
          obs.next(slots);
          obs.complete();
        },
        e => obs.error(e)
      );
    });
  }

  // ----------------------------------------------------------- appointments

  /** REAL: GET /api/appointments?SearchIDNumber=...  |  MOCK: in-memory store. */
  getHistory(q: HistoryQuery): Observable<HistoryResult> {
    if (this.useMock) {
      this.mockEnsureSeed();
      const term = (q.search || '').trim().toLowerCase();
      const items = this.mockStore
        .filter(a => q.status === 'All' || !q.status || a.status === q.status)
        .filter(a => !term || (a.counselingTypeName + ' ' + a.counselorName + ' ' + a.date + ' ' + a.notes + ' ' + a.status)
          .toLowerCase().indexOf(term) >= 0)
        .sort((a, b) => (a.date + a.startTime) < (b.date + b.startTime) ? 1 : -1);
      const from = q.pageIndex * q.pageSize;
      return of({ items: items.slice(from, from + q.pageSize), total: items.length }).pipe(delay(200));
    }
    return new Observable(obs => {
      this.getStudentProfile().subscribe(p => {
        this.api.getHistory(p, q).subscribe(r => { obs.next(r); obs.complete(); }, e => obs.error(e));
      }, e => obs.error(e));
    });
  }

  /**
   * The student's first active appointment (Pending or Approved), or null.
   * Used to drive the activity indicator and color dot in MainComponent.
   */
  getPending(): Observable<Appointment> {
    if (this.useMock) {
      this.mockEnsureSeed();
      const active = this.mockStore.filter(a => a.status === 'Pending' || a.status === 'Approved')[0] || null;
      return of(active).pipe(delay(100));
    }
    return new Observable(obs => {
      this.getStudentProfile().subscribe(p => {
        this.api.getPending(p).subscribe(a => { obs.next(a); obs.complete(); }, e => obs.error(e));
      }, e => obs.error(e));
    });
  }

  /** REAL: POST /api/appointments  |  MOCK: in-memory create. */
  book(req: BookingRequest): Observable<Appointment> {
    if (this.useMock) {
      this.mockEnsureSeed();
      if (!req.notes || !req.notes.trim()) {
        return throwError(new Error('Please describe your concern in the notes.'));
      }
      const problem = this.mockValidate(req, null);
      if (problem) { return throwError(new Error(problem)); }
      return of(this.mockCreate(req)).pipe(delay(300));
    }
    return new Observable(obs => {
      this.getStudentProfile().subscribe(p => {
        this.api.book(p, req).subscribe(a => { obs.next(a); obs.complete(); }, e => obs.error(e));
      }, e => obs.error(e));
    });
  }

  /**
   * REAL: POST /api/appointments/{id}/reschedule (RescheduleDto)  |  MOCK: in-memory reschedule.
   * Allowed for BOTH 'Pending' AND 'Approved' appointments.
   * A live failure surfaces as an error — it is never silently replaced with mock success.
   */
  reschedule(id: number, req: RescheduleRequest): Observable<Appointment> {
    if (this.useMock) {
      this.mockEnsureSeed();
      const old = this.mockStore.filter(a => a.id === id)[0];
      if (!old || (old.status !== 'Pending' && old.status !== 'Approved')) {
        return throwError(new Error('Only a pending or approved appointment can be rescheduled.'));
      }
      const full: BookingRequest = {
        counselorId: old.counselorId, counselingTypeId: old.counselingTypeId,
        date: req.date, startTime: req.startTime, endTime: req.endTime, notes: old.notes
      };
      const problem = this.mockValidate(full, id);
      if (problem) { return throwError(new Error(problem)); }
      old.status = 'Rescheduled';
      return of(this.mockCreate(full)).pipe(delay(300));
    }
    return new Observable(obs => {
      this.getStudentProfile().subscribe(p => {
        this.api.reschedule(p, id, req).subscribe(a => { obs.next(a); obs.complete(); }, e => obs.error(e));
      }, e => obs.error(e));
    });
  }

  /**
   * Confirm an 'Approved' appointment.
   * MOCK: updates status to 'Completed' in mockStore (simulating confirmation completing the loop).
   * LIVE: calls PUT /api/appointments/{id}/student-confirm.
   * After success in live mode, sends a student notification via POST /api/notifications.
   * NOTE: Counselor notification is NOT supported by the current API schema (NotificationDto
   * has only idNumber, not employeeID). This is documented as a backend dependency.
   */
  studentConfirm(id: number): Observable<Appointment> {
    if (this.useMock) {
      this.mockEnsureSeed();
      const appt = this.mockStore.filter(a => a.id === id)[0];
      if (!appt || appt.status !== 'Approved') {
        return throwError(new Error('Only an approved appointment can be confirmed.'));
      }
      appt.status = 'Completed';
      return of({ ...appt }).pipe(delay(300));
    }
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
   * Send a notification to the student.
   * LIVE: calls POST /api/notifications with the student's idNumber.
   * MOCK: no-op (returns success immediately).
   * NOTE: Counselor notifications are NOT supported — NotificationDto has no employeeID field.
   * BACKEND DEPENDENCY: To notify counselors, the backend must add employeeID to NotificationDto
   * or provide a separate counselor notification endpoint.
   */
  sendNotification(content: string): Observable<any> {
    if (this.useMock) { return of(null).pipe(delay(100)); }
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
   * MOCK: returns 0 (no unread notifications in mock store).
   */
  getUnreadNotificationCount(): Observable<number> {
    if (this.useMock) { return of(0).pipe(delay(50)); }
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

  // ---------------------------------------------------------------- mock helpers

  private mockIsTaken(counselorId: string, date: string, start: string, ignoreId: number = null): boolean {
    if (this.mockStore.some(a => a.id !== ignoreId && a.status !== 'Rescheduled' &&
      a.counselorId === counselorId && a.date === date && a.startTime === start)) { return true; }
    return this.mockHash(counselorId + '|' + date + '|' + start) % 4 === 0;
  }

  mockHash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }

  private mockValidate(r: BookingRequest, ignoreId: number): string {
    if (!r.date || !r.startTime) { return 'Please choose a date and a time.'; }
    if (!r.counselingTypeId) { return 'Please choose a counseling type.'; }
    if (this.isWeekend(r.date)) { return 'Appointments are not available on weekends.'; }
    if (r.date < this.today()) { return 'Please choose today or a later date.'; }
    if (!this.daySlots().some(s => s.start === r.startTime)) { return 'That time is outside office hours.'; }
    if (this.mockIsTaken(r.counselorId, r.date, r.startTime, ignoreId)) {
      return 'That time slot is no longer available. Please pick another.';
    }
    if (this.mockStore.some(a => (a.status === 'Pending' || a.status === 'Approved') && a.id !== ignoreId)) {
      return 'You already have a pending appointment. Reschedule it or attend it before booking another.';
    }
    if (this.mockStore.some(a => a.id !== ignoreId && a.status !== 'Rescheduled' && a.date === r.date && a.startTime === r.startTime)) {
      return 'You already have an appointment at that time.';
    }
    return null;
  }

  private mockCreate(r: BookingRequest): Appointment {
    const type = MOCK_COUNSELING_TYPES.filter(t => t.id === r.counselingTypeId)[0];
    const a: Appointment = {
      id: this.mockNextId++,
      studentId: String(this.global.requestid()),
      counselorId: r.counselorId,
      counselorName: 'Guidance Counselor (' + r.counselorId.replace('C-', '') + ')',
      counselingTypeId: r.counselingTypeId,
      counselingTypeName: type ? type.name : '',
      date: r.date, startTime: r.startTime, endTime: r.endTime,
      status: 'Pending',
      schoolYear: String(this.global.constSY || this.global.sy || ''),
      notes: r.notes || ''
    };
    this.mockStore.push(a);
    return a;
  }

  private mockEnsureSeed() {
    if (this.mockStore.length) { return; }
    // Include statuses to cover all cases; 'Approved' is seeded for testability (REQ 1B).
    const statuses: AppointmentStatus[] = ['Completed', 'Completed', 'Rescheduled', 'No-show', 'Approved'];
    const slots = this.daySlots();
    const today = this.parseIso(this.today());
    let d = new Date(today.getTime());
    for (let i = 0; i < 12; i++) {
      do { d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 3); } while (d.getDay() === 0 || d.getDay() === 6);
      const type = MOCK_COUNSELING_TYPES[i % MOCK_COUNSELING_TYPES.length];
      const slot = slots[(i * 3) % slots.length];
      this.mockStore.push({
        id: this.mockNextId++,
        studentId: String(this.global.requestid()),
        counselorId: 'C-MOCK', counselorName: 'Guidance Counselor',
        counselingTypeId: type.id, counselingTypeName: type.name,
        date: this.toIso(d), startTime: slot.start, endTime: slot.end,
        status: statuses[i % statuses.length],
        schoolYear: String(this.global.constSY || this.global.sy || ''),
        notes: ''
      });
    }
    // Add a future 'Approved' appointment for testability (REQ 1B, REQ 5)
    let futureDate = new Date(today.getTime());
    do { futureDate = new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate() + 3); } while (futureDate.getDay() === 0 || futureDate.getDay() === 6);
    this.mockStore.push({
      id: this.mockNextId++,
      studentId: String(this.global.requestid()),
      counselorId: 'C-MOCK', counselorName: 'Guidance Counselor',
      counselingTypeId: '1', counselingTypeName: 'Academic Concerns',
      date: this.toIso(futureDate), startTime: slots[0].start, endTime: slots[0].end,
      status: 'Approved',
      schoolYear: String(this.global.constSY || this.global.sy || ''),
      notes: 'Follow-up discussion on academic standing.'
    });
  }
}
