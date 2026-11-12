import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { GlobalService } from '../global.service';
import {
  Appointment, AppointmentStatus, BookingRequest, Counselor, CounselingType,
  HistoryQuery, HistoryResult, OFFICE_HOURS, RescheduleRequest, SLOT_MINUTES, StudentProfile
} from './guidance.models';

/*
  CounselLinkApi: the REAL calls to CounselLink.API (see swagger.json).
  GuidanceService delegates to this class when useMock = false; the screens never talk to it directly.

  ASSUMPTIONS TO VALIDATE WITH THE API TEAM (each one is marked "ASSUMPTION" below):
    A1  Base URL. Read from environment.counsellinkApi; falls back to COUNSELLINK_API_BASE only while unset.
        The backend team must supply the real host (with a trailing /api/).
    A2  Same auth headers as the portal API (global.option). Content-Type is forced to application/json.
    A3  Responses are a bare array/object, or wrapped as { data: ... } (data may be a JSON string).
        Field names are matched case-insensitively, so appointmentID / AppointmentID both work.
    A4  Appointment rows expose appointmentID, idNumber, employeeID, appointmentDate, appointmentTime,
        appointmentTypeID, appointmentStatusID, concernDescription (the names from CreateAppointmentDto).
    A5  There is no slots endpoint: taken slots are derived from GET /appointments for the counselor + date.
    A6  Reschedule uses the dedicated POST /api/appointments/{id}/reschedule endpoint (RescheduleDto:
        newStartDate, newEndDate, rescheduleNote). Both 'Pending' and 'Approved' appointments may be rescheduled.
    A7  Status names are matched by keyword (see labelFor). Anything unrecognised is shown as 'Pending'.
        'Approved' status is mapped from names containing 'approv' or 'confirm' but NOT 'schedul' or 'pend'.

  BACKEND DEPENDENCIES / GAPS:
    - PUT /api/appointments/{id} (edit) is a counselor/admin endpoint — no student-facing edit endpoint exists.
    - PUT /api/appointments/{id}/student-confirm: used to confirm an approved appointment.
    - POST /api/notifications: NotificationDto has { notificationID, idNumber, content, notificationStatus }.
      The idNumber is a STUDENT id number. There is NO employeeID field on NotificationDto, so counselor
      notifications via this endpoint are NOT supported by the current API schema.
    - No 'createdBy', 'initiatedBy', or 'originatedBy' field in appointment response — RED color is inferred
      from 'Approved' status as a proxy for counselor activity.
    - Slot ownership (Own vs Unavailable) requires the authenticated student's idNumber to be compared against
      the idNumber field in appointment rows. Backend ownership/authorization enforcement is required server-side;
      frontend filtering alone is insufficient.
*/

/** ASSUMPTION A1: fallback base URL while environment.counsellinkApi is unset. Needs the trailing /api/. */
export const COUNSELLINK_API_BASE = 'https://TODO-counsellink-api-host/api/';

const REQUEST_TIMEOUT_MS = 20000;

interface Named { id: number; name: string; }
interface Lookups { statuses: Named[]; types: Named[]; counselors: any[]; }

// ---------------------------------------------------------------- tiny helpers

/** Case-insensitive property read, so the API may send camelCase or PascalCase. */
function field(o: any, name: string): any {
  if (!o || typeof o !== 'object') { return undefined; }
  if (o[name] !== undefined) { return o[name]; }
  const lower = name.toLowerCase();
  const keys = Object.keys(o);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === lower) { return o[keys[i]]; }
  }
  return undefined;
}

function firstDefined(o: any, names: string[]): any {
  for (let i = 0; i < names.length; i++) {
    const v = field(o, names[i]);
    if (v !== undefined && v !== null) { return v; }
  }
  return undefined;
}

/** Turn any of: [..], {data:[..]}, {data:"json"}, {..}, null into an array of rows. */
function rows(body: any, depth: number = 0): any[] {
  let d = body;
  if (typeof d === 'string') {
    try { d = JSON.parse(d); } catch (e) { return []; }
  }
  if (d === null || d === undefined) { return []; }
  if (Array.isArray(d)) { return d; }
  if (typeof d === 'object') {
    const inner = depth < 2 ? firstDefined(d, ['data', 'result', 'items']) : undefined;
    if (inner !== undefined && inner !== null) { return rows(inner, depth + 1); }
    return [d];
  }
  return [];
}

const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
const toMin = (t: string) => { const p = t.split(':'); return (+p[0]) * 60 + (+p[1]); };
const fromMin = (m: number) => pad(Math.floor(m / 60)) + ':' + pad(m % 60);

/** '08:30:00', '08:30:00.0000000' or '2026-10-26T08:30:00' -> '08:30' */
function toHm(v: any): string {
  const m = /(\d{1,2}):(\d{2})/.exec(String(v === null || v === undefined ? '' : v));
  return m ? pad(+m[1]) + ':' + m[2] : '';
}

/** '2026-10-26T00:00:00' -> '2026-10-26' (cut the text, never go through Date: no timezone shift). */
function toYmd(v: any): string {
  const s = String(v === null || v === undefined ? '' : v);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.substring(0, 10) : '';
}

/** End of a booking slot: one SLOT_MINUTES, but never past the end of its office-hours block. */
function endFor(start: string): string {
  if (!start) { return ''; }
  const s = toMin(start);
  for (let i = 0; i < OFFICE_HOURS.length; i++) {
    const b = OFFICE_HOURS[i];
    if (s >= toMin(b.start) && s < toMin(b.end)) { return fromMin(Math.min(s + SLOT_MINUTES, toMin(b.end))); }
  }
  return fromMin(s + SLOT_MINUTES);
}

/**
 * ASSUMPTION A7: map the API's status names onto the labels the screens know.
 * - 'Approved': names containing 'approv' or 'confirm' but NOT 'schedul' or 'pend'.
 *   This represents counselor-approved/confirmed appointments.
 * - 'Rescheduled': names containing 'resched'.
 * - 'Completed': names containing 'complet', 'attended', or 'done'.
 * - 'No-show': names containing 'noshow'.
 * - 'Pending': everything else (including 'pend', 'request', 'book', 'open', 'await', 'schedul').
 */
export function labelFor(name: string): AppointmentStatus {
  const n = (name || '').toLowerCase().replace(/[^a-z]/g, '');
  if (n.indexOf('noshow') >= 0) { return 'No-show'; }
  if (n.indexOf('resched') >= 0) { return 'Rescheduled'; }
  if (n.indexOf('complet') >= 0 || n.indexOf('attended') >= 0 || n.indexOf('done') >= 0) { return 'Completed'; }
  // 'Approved' = counselor has approved/confirmed: contains 'approv' or 'confirm', but not 'schedul' or 'pend'
  if ((n.indexOf('approv') >= 0 || n.indexOf('confirm') >= 0) &&
      n.indexOf('schedul') < 0 && n.indexOf('pend') < 0) {
    return 'Approved';
  }
  if (n && !/(pend|confirm|schedul|approv|await|request|book|open)/.test(n)) {
    console.warn('[CounselLinkApi] Unrecognised appointment status "' + name + '", showing it as Pending.');
  }
  return 'Pending';
}

const norm = (s: any) => String(s === null || s === undefined ? '' : s).trim().toLowerCase();

// ------------------------------------------------------------------------ api

@Injectable({ providedIn: 'root' })
export class CounselLinkApi {
  private statuses: Named[] = null;
  private types: Named[] = null;
  private counselorRows: any[] = null;
  /** Raw appointment rows by id, so a later PUT can resend the fields we are not changing. */
  private raw: { [id: number]: any } = {};

  constructor(private http: Http, private global: GlobalService) { }

  // ------------------------------------------------------------------ http

  private url(path: string, params?: { [k: string]: any }): string {
    const base = String(environment.counsellinkApi || COUNSELLINK_API_BASE).replace(/\/?$/, '/');
    let q = '';
    if (params) {
      const parts = Object.keys(params)
        .filter(k => params[k] !== null && params[k] !== undefined && params[k] !== '')
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
      if (parts.length) { q = '?' + parts.join('&'); }
    }
    return base + path + q;
  }

  /** ASSUMPTION A2: portal auth headers (global.option) + a JSON content type for the .NET API. */
  private options(): RequestOptions {
    const base: any = this.global.option || {};
    const h = new Headers();
    try {
      if (base.headers && base.headers.keys) {
        base.headers.keys().forEach((k: string) => h.set(k, base.headers.get(k)));
      }
    } catch (e) { /* headers could not be copied; fall through with the JSON header only */ }
    h.set('Content-Type', 'application/json');
    return new RequestOptions({ headers: h, withCredentials: base.withCredentials });
  }

  private parse(r: any): any {
    try { return r.json(); } catch (e) { return r && r.text ? r.text() : null; }
  }

  private get(path: string, params?: { [k: string]: any }): Observable<any> {
    return this.http.get(this.url(path, params), this.options()).pipe(
      timeout(REQUEST_TIMEOUT_MS), map(r => this.parse(r)), catchError(e => throwError(this.friendly(e))));
  }

  private send(method: 'post' | 'put' | 'delete', path: string, body?: any): Observable<any> {
    const u = this.url(path);
    const call = method === 'delete' ? this.http.delete(u, this.options())
      : method === 'put' ? this.http.put(u, JSON.stringify(body), this.options())
        : this.http.post(u, JSON.stringify(body), this.options());
    return call.pipe(timeout(REQUEST_TIMEOUT_MS), map(r => this.parse(r)), catchError(e => throwError(this.friendly(e))));
  }

  /** Errors the student can safely read. Never shows raw server text longer than a sentence or two. */
  private friendly(e: any): Error {
    if (e && e.name === 'TimeoutError') { return new Error('The guidance server took too long to respond. Please try again.'); }
    if (e instanceof Error && (e as any).status === undefined) { return e; }
    if (e && e.status === 0) { return new Error('Cannot reach the guidance server. Please check your connection.'); }
    let msg = '';
    try {
      const b = e.json ? e.json() : null;
      msg = typeof b === 'string' ? b : (b && (b.message || b.detail || b.title)) || '';
    } catch (x) {
      try { msg = e.text ? e.text() : ''; } catch (y) { msg = ''; }
    }
    if (e && e.status >= 400 && e.status < 500 && typeof msg === 'string' && msg && msg.length <= 200) {
      return new Error(msg);
    }
    return new Error('Something went wrong with the guidance service. Please try again.');
  }

  // ------------------------------------------------------------- lookups

  private constants(type: string): Observable<Named[]> {
    // ConstantDto per Swagger = { id, value }; 'value' is read first, with tolerant fallbacks.
    return this.get('constants/' + type).pipe(map(body => rows(body)
      .filter(r => field(r, 'isActive') !== false)
      .map(r => ({
        id: +firstDefined(r, ['id', type + 'ID']),
        name: String(firstDefined(r, ['value', 'name', type + 'Name', type, 'description']) || '')
      }))
      .filter(n => !isNaN(n.id))));
  }

  getStatuses(): Observable<Named[]> {
    if (this.statuses) { return of(this.statuses); }
    return this.constants('AppointmentStatus').pipe(tap(s => this.statuses = s));
  }

  private getTypes(): Observable<Named[]> {
    if (this.types) { return of(this.types); }
    return this.constants('AppointmentType').pipe(tap(t => this.types = t));
  }

  private getCounselorRows(): Observable<any[]> {
    if (this.counselorRows) { return of(this.counselorRows); }
    return this.get('counselors').pipe(map(b => rows(b)), tap(c => this.counselorRows = c));
  }

  private lookups(): Observable<Lookups> {
    return forkJoin(this.getStatuses(), this.getTypes(), this.getCounselorRows())
      .pipe(map(r => ({ statuses: r[0], types: r[1], counselors: r[2] })));
  }

  private counselorName(rowsList: any[], employeeId: string): string {
    const c = rowsList.filter(x => norm(field(x, 'employeeID')) === norm(employeeId))[0];
    if (!c) { return ''; }
    return [field(c, 'firstName'), field(c, 'lastName')].map(x => (x || '').trim()).filter(x => x).join(' ');
  }

  private statusIdFor(statuses: Named[], label: AppointmentStatus): number {
    const same = statuses.filter(s => labelFor(s.name) === label);
    if (label === 'Pending') {
      const exact = same.filter(s => norm(s.name).indexOf('pend') >= 0)[0];
      if (exact) { return exact.id; }
    }
    return same.length ? same[0].id : null;
  }

  // ------------------------------------------------------ counselor and types

  /**
   * ASSUMPTION: assignments are matched by department (code or id), and also by program / year level when
   * the assignment states one. An explicit mismatch excludes the counselor; the best match wins.
   */
  getCounselor(p: StudentProfile, departmentCode: string): Observable<Counselor> {
    return forkJoin(this.get('counselor-assignments'), this.getCounselorRows()).pipe(map(r => {
      const assignments = rows(r[0]);
      const counselors = r[1].filter(c => field(c, 'isActive') !== false);
      let best: { id: string, score: number } = null;
      assignments.forEach(a => {
        const id = String(field(a, 'employeeID') || '');
        if (!id || !counselors.some(c => norm(field(c, 'employeeID')) === norm(id))) { return; }
        let score = 0;
        const dept = norm(field(a, 'departmentID'));
        if (dept) {
          if (dept !== norm(departmentCode) && dept !== norm(p.departmentId)) { return; }
          score += 4;
        }
        const prog = norm(field(a, 'programID'));
        if (prog) {
          if (prog !== norm(p.courseCode) && prog !== norm(p.course)) { return; }
          score += 2;
        }
        const yr = field(a, 'yearOrGradeLevel');
        if (yr !== null && yr !== undefined && yr !== '') {
          if (+yr !== +p.yearLevel) { return; }
          score += 1;
        }
        if (!best || score > best.score) { best = { id: id, score: score }; }
      });
      if (!best) { throw new Error('No guidance counselor is assigned to your department yet.'); }
      return {
        id: best.id,
        name: this.counselorName(counselors, best.id) || 'Guidance Counselor',
        departmentCode: departmentCode
      };
    }));
  }

  /** The only type the booking call can send is appointmentTypeID (CreateAppointmentDto has no concern type id). */
  getCounselingTypes(): Observable<CounselingType[]> {
    return this.getTypes().pipe(map(t => t.map(x => ({ id: String(x.id), name: x.name }))));
  }

  // ------------------------------------------------------------------ slots

  /**
   * ASSUMPTION A5: start times ('HH:mm') already used on that date by this counselor.
   * Returns tuples of { startTime, studentId } so the caller can distinguish own vs others.
   * The student's own idNumber is used ONLY to mark the slot as 'Own' — no other student
   * data is ever exposed to the UI.
   */
  getTakenSlotDetails(counselorId: string, date: string): Observable<{ startTime: string, studentId: string }[]> {
    return forkJoin(
      this.get('appointments', { SearchEmployeeID: counselorId, SearchStartDate: date, SearchEndDate: date }),
      this.getStatuses()
    ).pipe(map(r => {
      const taken: { startTime: string, studentId: string }[] = [];
      rows(r[0]).forEach(row => {
        if (toYmd(field(row, 'appointmentDate')) !== date) { return; }
        const st = r[1].filter(s => s.id === +field(row, 'appointmentStatusID'))[0];
        if (st && labelFor(st.name) === 'Rescheduled') { return; }
        const t = toHm(field(row, 'appointmentTime'));
        const sid = String(field(row, 'idNumber') || '');
        if (t && !taken.some(x => x.startTime === t)) {
          taken.push({ startTime: t, studentId: sid });
        }
      });
      return taken;
    }));
  }

  /** Legacy helper used by the existing reschedule() path; kept for compatibility. */
  getTakenStarts(counselorId: string, date: string): Observable<string[]> {
    return this.getTakenSlotDetails(counselorId, date).pipe(map(slots => slots.map(s => s.startTime)));
  }

  // ----------------------------------------------------------- appointments

  private toAppointment(row: any, lk: Lookups): Appointment {
    const id = +field(row, 'appointmentID');
    this.raw[id] = row;
    const start = toHm(field(row, 'appointmentTime'));
    const counselorId = String(field(row, 'employeeID') || '');
    const typeId = field(row, 'appointmentTypeID');
    const type = lk.types.filter(t => t.id === +typeId)[0];
    const st = lk.statuses.filter(s => s.id === +field(row, 'appointmentStatusID'))[0];
    const statusName = st ? st.name : String(firstDefined(row, ['appointmentStatus', 'statusName']) || '');
    return {
      id: id,
      studentId: String(field(row, 'idNumber') || ''),
      counselorId: counselorId,
      counselorName: this.counselorName(lk.counselors, counselorId) || String(field(row, 'counselorName') || 'Guidance Counselor'),
      counselingTypeId: typeId === undefined || typeId === null ? '' : String(typeId),
      counselingTypeName: type ? type.name : String(field(row, 'appointmentTypeName') || ''),
      date: toYmd(field(row, 'appointmentDate')),
      startTime: start,
      endTime: endFor(start),
      status: labelFor(statusName),
      schoolYear: String((this.global as any).syear || ''),
      notes: String(field(row, 'concernDescription') || '')
    };
  }

  private studentAppointments(p: StudentProfile): Observable<Appointment[]> {
    return forkJoin(this.get('appointments', { SearchIDNumber: p.idNumber }), this.lookups())
      .pipe(map(r => rows(r[0]).map(row => this.toAppointment(row, r[1]))));
  }

  /** ASSUMPTION: the endpoint has no paging, search or label filter, so all of one student's rows are fetched and cut here. */
  getHistory(p: StudentProfile, q: HistoryQuery): Observable<HistoryResult> {
    return this.studentAppointments(p).pipe(map(all => {
      const term = (q.search || '').trim().toLowerCase();
      const items = all
        .filter(a => !q.status || q.status === 'All' || a.status === q.status)
        .filter(a => !term || (a.counselingTypeName + ' ' + a.counselorName + ' ' + a.date + ' ' + a.notes + ' ' + a.status)
          .toLowerCase().indexOf(term) >= 0)
        .sort((a, b) => (a.date + a.startTime) < (b.date + b.startTime) ? 1 : -1);
      const from = q.pageIndex * q.pageSize;
      return { items: items.slice(from, from + q.pageSize), total: items.length };
    }));
  }

  getPending(p: StudentProfile): Observable<Appointment> {
    return this.studentAppointments(p).pipe(map(all =>
      all.filter(a => a.status === 'Pending' || a.status === 'Approved')[0] || null));
  }

  book(p: StudentProfile, req: BookingRequest): Observable<Appointment> {
    return this.submit(p, req, null);
  }

  /**
   * Reschedule endpoint: POST /api/appointments/{id}/reschedule (RescheduleDto: newStartDate, newEndDate, rescheduleNote).
   * Allowed for BOTH 'Pending' AND 'Approved' appointments (REQ 1B — rescheduling after counselor approval).
   * A live failure surfaces as a friendly error; it is never silently swallowed.
   */
  reschedule(p: StudentProfile, id: number, req: RescheduleRequest): Observable<Appointment> {
    return this.studentAppointments(p).pipe(switchMap(all => {
      const old = all.filter(a => a.id === id)[0];
      if (!old || (old.status !== 'Pending' && old.status !== 'Approved')) {
        return throwError(new Error('Only a pending or approved appointment can be rescheduled.'));
      }
      const body = {
        newStartDate: req.date + 'T' + req.startTime + ':00',
        newEndDate: req.date + 'T' + req.endTime + ':00',
        rescheduleNote: 'Rescheduled by the student to ' + req.date + ' ' + req.startTime + '.'
      };
      return this.send('post', 'appointments/' + id + '/reschedule', body).pipe(
        switchMap(() => this.studentAppointments(p).pipe(map(list => {
          const found = list.filter(a => a.date === req.date && a.startTime === req.startTime && a.status !== 'Rescheduled')[0]
            || list.filter(a => a.status === 'Pending' || a.status === 'Approved')[0];
          if (!found) {
            throw new Error('Your appointment was rescheduled, but it could not be loaded. Please check your history.');
          }
          return found;
        })))
      );
    }));
  }

  /**
   * PUT /api/appointments/{id}/student-confirm — body: StudentIdNumberDto { idNumber: string }.
   * Called when a student confirms a counselor-approved appointment.
   * Returns the updated appointment if re-fetch succeeds.
   */
  studentConfirm(p: StudentProfile, id: number): Observable<Appointment> {
    return this.send('put', 'appointments/' + id + '/student-confirm', { idNumber: p.idNumber }).pipe(
      switchMap(() => this.studentAppointments(p).pipe(map(list => {
        const found = list.filter(a => a.id === id)[0];
        if (!found) { throw new Error('Appointment confirmed, but could not be loaded. Please check your history.'); }
        return found;
      })))
    );
  }

  /**
   * POST /api/notifications — NotificationDto { notificationID, idNumber, content, notificationStatus }.
   * The idNumber is the STUDENT's id number (string). There is NO employeeID field on NotificationDto;
   * counselor notifications via this endpoint are NOT supported by the current API schema.
   * BACKEND DEPENDENCY: To notify the counselor, the backend must add employeeID support to NotificationDto
   * or provide a separate counselor-notification endpoint.
   */
  sendStudentNotification(p: StudentProfile, content: string): Observable<any> {
    const body = {
      notificationID: 0,
      idNumber: p.idNumber,
      content: content,
      notificationStatus: false
    };
    return this.send('post', 'notifications', body);
  }

  /**
   * GET /api/notifications?SearchIDNumber=...&SearchStatus=false
   * Returns count of unread notifications for the authenticated student.
   * NEVER exposes another student's notifications — scoped to p.idNumber.
   */
  getUnreadNotifications(p: StudentProfile): Observable<number> {
    return this.get('notifications', { SearchIDNumber: p.idNumber, SearchStatus: 'false' }).pipe(
      map(body => rows(body).length)
    );
  }

  /** Checks against live data, POSTs, then reads the new row back (the POST response shape is unknown). */
  private submit(p: StudentProfile, req: BookingRequest, replaceId: number): Observable<Appointment> {
    return forkJoin(this.studentAppointments(p), this.getTakenStarts(req.counselorId, req.date), this.getStatuses())
      .pipe(switchMap(r => {
        const mine = r[0], taken = r[1], statuses = r[2];
        if (mine.some(a => (a.status === 'Pending' || a.status === 'Approved') && a.id !== replaceId)) {
          return throwError(new Error('You already have a pending appointment. Reschedule it or attend it before booking another.'));
        }
        if (mine.some(a => a.id !== replaceId && a.status !== 'Rescheduled' && a.date === req.date && a.startTime === req.startTime)) {
          return throwError(new Error('You already have an appointment at that time.'));
        }
        if (taken.indexOf(req.startTime) >= 0) {
          return throwError(new Error('That time slot is no longer available. Please pick another.'));
        }
        const pendingId = this.statusIdFor(statuses, 'Pending');
        const body: any = {
          idNumber: p.idNumber,
          gradeOrYearLevel: p.yearLevel,
          programOrCourse: p.course,
          employeeID: req.counselorId,
          appointmentDate: req.date,
          appointmentTime: req.startTime + ':00',
          appointmentTypeID: +req.counselingTypeId,
          concernDescription: req.notes || null
        };
        if (pendingId !== null) { body.appointmentStatusID = pendingId; }
        return this.send('post', 'appointments', body).pipe(
          switchMap(res => this.findCreated(p, req, this.extractId(res))));
      }));
  }

  private extractId(res: any): number {
    if (typeof res === 'number') { return res; }
    if (typeof res === 'string' && /^\d+$/.test(res.trim())) { return +res; }
    const first = rows(res)[0];
    const v = first && typeof first === 'object'
      ? firstDefined(first, ['appointmentID', 'id', 'newAppointmentID', 'insertedID']) : undefined;
    return v !== undefined && !isNaN(+v) ? +v : null;
  }

  private findCreated(p: StudentProfile, req: BookingRequest, id: number): Observable<Appointment> {
    return this.studentAppointments(p).pipe(map(all => {
      const found = all.filter(a => id !== null ? a.id === id
        : a.date === req.date && a.startTime === req.startTime && a.counselorId === req.counselorId && a.status !== 'Rescheduled')[0];
      if (!found) { throw new Error('Your appointment was submitted, but could not be loaded. Please check your history.'); }
      return found;
    }));
  }
}
