import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { GlobalService } from '../global.service';
import { environment } from '../../environments/environment';
import { AppointmentDraft } from './guidance.models';

/**
 * AppointmentDraftService — Phase 2: HTTP-backed.
 *
 * Uses the same @angular/http / GlobalService.option auth pattern as the rest
 * of the guidance module (CounselLinkApi, CounselLinkIntegrationService).
 *
 * Endpoints (all under environment.counsellinkApi base URL):
 *   getDrafts(studentId)       → GET  appointments?SearchIDNumber={id}&SearchStatusID=5
 *   saveDraft(payload)         → POST appointment-drafts
 *   updateDraft(id, payload)   → PUT  appointment-drafts/{id}
 *   submitDraft(id, studentId) → POST appointment-drafts/{id}/submit  { idNumber }
 *   deleteDraft(id, studentId) → DELETE /api/appointments/{id}  (shared appointments endpoint)
 *
 * Phase 2 integration: all in-memory state has been removed.
 * The backend transitions status 5 → 1 on submit, so no client-side deleteDraft call
 * is needed after submitDraft succeeds.
 */

const TIMEOUT_MS = 20000;

@Injectable({ providedIn: 'root' })
export class AppointmentDraftService {

  constructor(private http: Http, private global: GlobalService) {}

  // ------------------------------------------------------------------ helpers

  private base(): string {
    return String(environment.counsellinkApi || '').replace(/\/?$/, '/');
  }

  private url(path: string, params?: { [k: string]: any }): string {
    let q = '';
    if (params) {
      const parts = Object.keys(params)
        .filter(k => params[k] !== null && params[k] !== undefined && params[k] !== '')
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
      if (parts.length) { q = '?' + parts.join('&'); }
    }
    return this.base() + path + q;
  }

  private opts(): RequestOptions {
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

  private parse(r: any): any {
    try { return r.json(); } catch (e) { return r.text ? r.text() : null; }
  }

  private friendly(e: any): Error {
    if (e instanceof Error && (e as any).status === undefined) { return e; }
    if (e && e.name === 'TimeoutError') { return new Error('Request timed out. Please try again.'); }
    if (e && e.status === 0) { return new Error('Cannot reach the server. Check your connection.'); }
    try {
      const b = e.json ? e.json() : null;
      const msg = typeof b === 'string' ? b : (b && (b.message || b.detail || b.title));
      if (msg && String(msg).length <= 300) { return new Error(String(msg)); }
    } catch (x) { /* ignore */ }
    return new Error('Something went wrong. Please try again.');
  }

  // ------------------------------------------------------------------ public API

  /**
   * GET appointments?SearchIDNumber={studentId}&SearchStatusID=5
   * Returns drafts (status 5) for the given student.
   * Normalises the { value: [...] } OData envelope the API may return.
   */
  getDrafts(studentId: string): Observable<AppointmentDraft[]> {
    return this.http
      .get(this.url('appointments', { SearchIDNumber: studentId, SearchStatusID: 5 }), this.opts())
      .pipe(
        timeout(TIMEOUT_MS),
        map(r => {
          const body = this.parse(r);
          const rows: any[] = Array.isArray(body) ? body
            : (body && Array.isArray(body.value)) ? body.value : [];
          return rows.map(row => this.rowToDraft(row));
        }),
        catchError(e => throwError(this.friendly(e)))
      );
  }

  /**
   * POST appointment-drafts
   * Creates a new draft. Sends null for appointmentDate/startTime/endTime so the draft
   * never blocks counselor availability. Returns the saved AppointmentDraft.
   */
  saveDraft(payload: Omit<AppointmentDraft, 'id' | 'savedAt'>, studentId: string): Observable<AppointmentDraft> {
    return this.http
      .post(this.url('appointment-drafts'), JSON.stringify(this.draftToRow(payload, studentId, false)), this.opts())
      .pipe(
        timeout(TIMEOUT_MS),
        map(r => {
          const body = this.parse(r);
          // Backend may return the created row or just { id, ... }
          const rows: any[] = Array.isArray(body) ? body
            : (body && Array.isArray(body.value)) ? body.value
            : (body ? [body] : []);
          return rows.length ? this.rowToDraft(rows[0]) : { ...payload, id: String(body && body.id || ''), savedAt: new Date().toISOString() };
        }),
        catchError(e => throwError(this.friendly(e)))
      );
  }

  /**
   * PUT appointment-drafts/{id}
   * Updates an existing draft. Sends null for appointmentDate/startTime/endTime so the
   * draft never blocks counselor availability. The student's selected date and time are
   * stored in sessionStorage only (see saveSelection / restoreSelection).
   */
  updateDraft(draft: AppointmentDraft, studentId: string): Observable<AppointmentDraft> {
    return this.http
      .put(this.url('appointment-drafts/' + draft.id), JSON.stringify(this.draftToRow(draft, studentId, false)), this.opts())
      .pipe(
        timeout(TIMEOUT_MS),
        map(r => {
          const body = this.parse(r);
          if (body && (body.id || body.AppointmentID || body.appointmentID)) {
            return this.rowToDraft(body);
          }
          // Backend returned no body — echo back the draft we sent with updated timestamp.
          return { ...draft, savedAt: new Date().toISOString() };
        }),
        catchError(e => throwError(this.friendly(e)))
      );
  }

  /**
   * PUT appointment-drafts/{id} — submit path only.
   * Same as updateDraft but sends the actual appointmentDate, startTime, and endTime so the
   * backend has real values to associate with the submitted appointment (status 5 → 1).
   * Called by the component immediately before submitDraft().
   */
  updateDraftForSubmit(draft: AppointmentDraft, studentId: string): Observable<AppointmentDraft> {
    return this.http
      .put(this.url('appointment-drafts/' + draft.id), JSON.stringify(this.draftToRow(draft, studentId, true)), this.opts())
      .pipe(
        timeout(TIMEOUT_MS),
        map(r => {
          const body = this.parse(r);
          if (body && (body.id || body.AppointmentID || body.appointmentID)) {
            return this.rowToDraft(body);
          }
          return { ...draft, savedAt: new Date().toISOString() };
        }),
        catchError(e => throwError(this.friendly(e)))
      );
  }

  /**
   * POST appointment-drafts/{id}/submit  Body: { idNumber: studentId }
   * Transitions the draft (status 5) to a submitted appointment (status 1).
   * The backend handles the status transition — no client-side deleteDraft needed.
   */
  submitDraft(id: string, studentId: string): Observable<any> {
    return this.http
      .post(this.url('appointment-drafts/' + id + '/submit'), JSON.stringify({ idNumber: studentId }), this.opts())
      .pipe(
        timeout(TIMEOUT_MS),
        map(r => this.parse(r)),
        catchError(e => throwError(this.friendly(e)))
      );
  }

  /**
   * DELETE /api/appointments/{id}
   * Reuses the shared appointments DELETE endpoint — same as deleting a regular appointment.
   * studentId is kept as a parameter for caller consistency but is not sent in the URL;
   * authorization is enforced by the Bearer token via GlobalService.option.
   */
  deleteDraft(id: string, studentId: string): Observable<void> {
    return this.http
      .delete(this.url('appointments/' + id), this.opts())
      .pipe(
        timeout(TIMEOUT_MS),
        map(() => undefined as void),
        catchError(e => throwError(this.friendly(e)))
      );
  }

  // ------------------------------------------------------------------ mapping

  /** Map an API appointment row (PascalCase) to AppointmentDraft. */
  private rowToDraft(row: any): AppointmentDraft {
    // Case-insensitive field getter — API may return PascalCase or camelCase.
    const get = (pascal: string, camel: string): any => {
      const v = row[camel] !== undefined ? row[camel] : row[pascal];
      return (v === null || v === undefined) ? '' : v;
    };

    // Parse "HH:mm:ss" or "HH:mm:ss.0000000" or ISO string → "HH:mm". Returns '' on garbage.
    const toHm = (raw: any): string => {
      const s = String(raw || '');
      // ISO date-time: grab the time portion after 'T'
      const timePart = s.indexOf('T') >= 0 ? s.split('T')[1] : s;
      const m = /^(\d{1,2}):(\d{2})/.exec(timePart);
      return m ? (m[1].length === 1 ? '0' + m[1] : m[1]) + ':' + m[2] : '';
    };

    // Parse "YYYY-MM-DDTxx:xx:xx" → "YYYY-MM-DD". Returns '' on garbage.
    const toDate = (raw: any): string => {
      const s = String(raw || '');
      return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.substring(0, 10) : '';
    };

    // Numeric ID — guard zero/null/undefined → returns '' so downstream || fallbacks work.
    const toId = (raw: any): string => {
      if (raw === null || raw === undefined || raw === '' || raw === 0) { return ''; }
      return String(raw);
    };

    return {
      id:              toId(get('AppointmentID', 'appointmentID') || get('id', 'id')),
      counselorId:     String(get('EmployeeID', 'employeeID')),
      counselorName:   String(get('CounselorName', 'counselorName')),
      concernTypeId:   toId(get('ConcernTypeID', 'concernTypeID')),
      concernTypeName: String(get('ConcernType', 'concernType')),
      date:            toDate(get('AppointmentDate', 'appointmentDate')),
      // Backend returns StartTime / EndTime (also AppointmentTime = StartTime)
      startTime:       toHm(get('StartTime', 'startTime') || get('AppointmentTime', 'appointmentTime')),
      endTime:         toHm(get('EndTime', 'endTime')),
      notes:           String(get('ConcernDescription', 'concernDescription') || get('Reason', 'reason') || get('Remarks', 'remarks')),
      gradeOrYearLevel: (get('GradeOrYearLevel', 'gradeOrYearLevel') !== '' && get('GradeOrYearLevel', 'gradeOrYearLevel') !== null)
                          ? Number(get('GradeOrYearLevel', 'gradeOrYearLevel')) : null,
      savedAt:         String(get('UpdatedAt', 'updatedAt') || get('CreatedAt', 'createdAt') || new Date().toISOString()),
    };
  }

  /** Map AppointmentDraft to the API request body.
   * @param includeDateTime When true (submit path only), sends the real appointmentDate,
   * startTime, and endTime so the backend has values after the status 5 → 1 transition.
   * When false (all draft save/update calls), sends null for all three fields so the draft
   * never blocks counselor availability.
   */
  private draftToRow(draft: Partial<AppointmentDraft>, studentId: string, includeDateTime: boolean): any {
    // Only append ':00' if the value is exactly 'HH:mm'. Guard against double-appending.
    const toApiTime = (t: string | undefined): string | null => {
      if (!t || t.trim() === '') { return null; }
      return /^\d{2}:\d{2}$/.test(t.trim()) ? t.trim() + ':00' : t.trim();
    };
    return {
      idNumber:            studentId,
      employeeID:          (draft.counselorId && draft.counselorId.trim() !== '') ? draft.counselorId.trim() : null,
      concernTypeID:       (draft.concernTypeId && draft.concernTypeId !== '0' && draft.concernTypeId !== '')
                             ? Number(draft.concernTypeId) : null,
      // Send null on every draft save/update so drafts never block counselor availability.
      // Send the real values only on the submit path (includeDateTime = true).
      appointmentDate:     includeDateTime
                             ? ((draft.date && draft.date.trim() !== '')
                               ? (draft.date.indexOf('T') >= 0 ? draft.date : draft.date + 'T00:00:00') : null)
                             : null,
      startTime:           includeDateTime ? toApiTime(draft.startTime) : null,
      endTime:             includeDateTime ? toApiTime(draft.endTime)   : null,
      concernDescription:  (draft.notes && draft.notes.trim() !== '') ? draft.notes.trim() : null,
      // appointmentTypeID 1 = Student Initiated (GET /api/constants/AppointmentType, confirmed).
      // All student-created drafts are Student Initiated — this is not a user-visible choice.
      appointmentTypeID:   1,
      // gradeOrYearLevel from the authenticated student's profile; sent as null if unavailable.
      gradeOrYearLevel:    (draft.gradeOrYearLevel !== null && draft.gradeOrYearLevel !== undefined)
                             ? draft.gradeOrYearLevel : null,
      appointmentStatusID: 5,
    };
  }

  // ------------------------------------------------------------------ sessionStorage helpers
  // The student's preferred date and time are never stored in the database while the
  // appointment is a draft. Instead they are kept in sessionStorage (tab-scoped, cleared
  // when the tab closes or on successful submit).

  private selectionKey(studentId: string, draftId: string): string {
    return 'draft_sel_' + studentId + '_' + draftId;
  }

  /**
   * Persist the student's selected date and time for a draft in sessionStorage.
   * Call this after every successful saveDraft / updateDraft response.
   */
  saveSelection(studentId: string, draftId: string, date: string, startTime: string, endTime: string): void {
    try {
      sessionStorage.setItem(
        this.selectionKey(studentId, draftId),
        JSON.stringify({ date: date || '', startTime: startTime || '', endTime: endTime || '' })
      );
    } catch (e) { /* sessionStorage unavailable — degrade silently */ }
  }

  /**
   * Retrieve the student's previously saved date/time selection for a draft.
   * Returns null if nothing is stored or the stored value cannot be parsed.
   */
  restoreSelection(studentId: string, draftId: string): { date: string; startTime: string; endTime: string } | null {
    try {
      const raw = sessionStorage.getItem(this.selectionKey(studentId, draftId));
      if (!raw) { return null; }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          date:      String(parsed.date      || ''),
          startTime: String(parsed.startTime || ''),
          endTime:   String(parsed.endTime   || ''),
        };
      }
    } catch (e) { /* ignore parse errors */ }
    return null;
  }

  /**
   * Remove the sessionStorage entry for a draft.
   * Call this after a successful submitDraft so temporary data is not left behind.
   */
  clearSelection(studentId: string, draftId: string): void {
    try {
      sessionStorage.removeItem(this.selectionKey(studentId, draftId));
    } catch (e) { /* ignore */ }
  }
}
