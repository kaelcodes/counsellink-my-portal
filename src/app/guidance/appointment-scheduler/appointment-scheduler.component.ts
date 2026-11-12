import { Component, OnInit, TemplateRef } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GuidanceService } from '../guidance.service';
import {
  Appointment, Counselor, CounselingType, OFFICE_HOURS, SLOT_MINUTES, StudentProfile, TimeSlot
} from '../guidance.models';

type CalendarView = 'day' | 'week' | 'month';

interface CalendarDay {
  iso: string;
  date: Date;
  num: number;
  inMonth: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-appointment-scheduler',
  templateUrl: './appointment-scheduler.component.html',
  styleUrls: ['./appointment-scheduler.component.scss']
})
export class AppointmentSchedulerComponent implements OnInit {
  // ---- page state
  loading = true;
  error = '';
  notice = '';

  profile: StudentProfile = null;
  counselor: Counselor = null;
  types: CounselingType[] = [];
  appointments: Appointment[] = [];
  pending: Appointment = null;

  // ---- calendar state
  view: CalendarView = 'week';
  cursor: Date = new Date();
  rows: { start: string, label: string }[] = [];
  weekDays: CalendarDay[] = [];
  monthCells: CalendarDay[] = [];
  readonly dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  private byDate: { [iso: string]: Appointment[] } = {};

  // ---- booking/reschedule/edit dialog state
  private dialogRef: MatDialogRef<any> = null;
  /** 'book' | 'reschedule' | 'edit' */
  mode: 'book' | 'reschedule' | 'edit' = 'book';
  form = { typeId: '', date: '', notes: '' };
  minDate = '';
  slots: TimeSlot[] = [];
  slotsLoading = false;
  selected: TimeSlot = null;
  formError = '';
  saving = false;

  /** True when useMock=false and an edit is requested (backend dependency — no student edit endpoint). */
  editDisabledInLive = false;

  constructor(private guidance: GuidanceService, private dialog: MatDialog) {
    this.rows = this.buildRows();
    this.cursor = this.parse(this.guidance.today());
  }

  ngOnInit() {
    this.load();
  }

  // ------------------------------------------------------------------ loading

  load() {
    this.loading = true;
    this.error = '';
    this.guidance.getStudentProfile().pipe(
      switchMap(p => {
        this.profile = p;
        return forkJoin(
          this.guidance.getCounselor(p.departmentCode),
          this.guidance.getCounselingTypes(),
          this.guidance.getHistory({ pageIndex: 0, pageSize: 1000, status: 'All', search: '' })
        );
      })
    ).subscribe(
      res => {
        this.counselor = res[0];
        this.types = res[1];
        this.setAppointments(res[2].items);
        this.loading = false;
      },
      e => {
        this.error = (e && e.message) ? e.message : 'Could not load your appointments.';
        this.loading = false;
      }
    );
  }

  private refresh() {
    this.guidance.getHistory({ pageIndex: 0, pageSize: 1000, status: 'All', search: '' }).subscribe(
      r => this.setAppointments(r.items),
      e => this.error = (e && e.message) ? e.message : 'Could not refresh your appointments.'
    );
  }

  private setAppointments(items: Appointment[]) {
    this.appointments = items;
    // Active appointment: first Pending or Approved
    this.pending = items.filter(a => a.status === 'Pending' || a.status === 'Approved')[0] || null;
    this.build();
  }

  // ----------------------------------------------------------------- calendar

  private buildRows(): { start: string, label: string }[] {
    const out: { start: string, label: string }[] = [];
    OFFICE_HOURS.forEach(block => {
      let t = this.toMin(block.start);
      const end = this.toMin(block.end);
      while (t < end) {
        const start = this.fromMin(t);
        out.push({ start: start, label: this.guidance.formatTime(start) });
        t = Math.min(t + SLOT_MINUTES, end);
      }
    });
    return out;
  }

  private build() {
    this.byDate = {};
    this.appointments.filter(a => a.status !== 'Rescheduled').forEach(a => {
      (this.byDate[a.date] = this.byDate[a.date] || []).push(a);
    });
    Object.keys(this.byDate).forEach(k => this.byDate[k].sort((a, b) => a.startTime < b.startTime ? -1 : 1));

    const todayIso = this.guidance.today();
    const weekStart = this.startOfWeek(this.cursor);
    this.weekDays = [];
    for (let i = 0; i < 5; i++) {
      this.weekDays.push(this.makeDay(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i),
        this.cursor.getMonth(), todayIso));
    }

    const first = new Date(this.cursor.getFullYear(), this.cursor.getMonth(), 1);
    const monthStart = this.startOfWeek(first);
    this.monthCells = [];
    for (let i = 0; i < 42; i++) {
      this.monthCells.push(this.makeDay(new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() + i),
        this.cursor.getMonth(), todayIso));
    }
  }

  private makeDay(d: Date, month: number, todayIso: string): CalendarDay {
    const iso = this.toIso(d);
    return { iso: iso, date: d, num: d.getDate(), inMonth: d.getMonth() === month, isToday: iso === todayIso };
  }

  setView(v: CalendarView) { this.view = v; this.build(); }

  step(dir: number) {
    const c = this.cursor;
    if (this.view === 'day') { this.cursor = new Date(c.getFullYear(), c.getMonth(), c.getDate() + dir); }
    if (this.view === 'week') { this.cursor = new Date(c.getFullYear(), c.getMonth(), c.getDate() + 7 * dir); }
    if (this.view === 'month') { this.cursor = new Date(c.getFullYear(), c.getMonth() + dir, 1); }
    this.build();
  }

  goToday() { this.cursor = this.parse(this.guidance.today()); this.build(); }

  openDay(d: CalendarDay) { this.cursor = d.date; this.view = 'day'; this.build(); }

  get cursorIso(): string { return this.toIso(this.cursor); }

  apptsOn(iso: string): Appointment[] { return this.byDate[iso] || []; }

  apptsAt(iso: string, start: string): Appointment[] {
    return this.apptsOn(iso).filter(a => a.startTime === start);
  }

  time(a: Appointment): string { return this.guidance.formatTime(a.startTime); }

  statusClass(a: Appointment): string { return 'st-' + a.status.toLowerCase().replace(/-/g, ''); }

  /**
   * Color class for appointment chips.
   * GREEN (appt-color-green): student-initiated 'Pending'.
   * RED (appt-color-red): 'Approved' — counselor activity (no createdBy field in API, using status as proxy).
   * YELLOW (appt-color-yellow): 'Rescheduled' — stays yellow even after confirmation.
   * '' for Completed and No-show.
   */
  colorClass(a: Appointment): string {
    if (a.status === 'Pending') { return 'appt-color-green'; }
    if (a.status === 'Approved') { return 'appt-color-red'; }
    if (a.status === 'Rescheduled') { return 'appt-color-yellow'; }
    return '';
  }

  /**
   * Label for a slot button in the slot picker.
   * 'Own' → 'Your appointment'
   * 'Unavailable' → 'Booked'   (NEVER expose another student's data)
   * 'Available' → the time range label
   */
  slotLabel(s: TimeSlot): string {
    if (s.status === 'Own') { return 'Your appointment'; }
    if (s.status === 'Unavailable') { return 'Booked'; }
    return s.label;
  }

  // ----------------------------------------------------------- booking dialog

  openBook(tpl: TemplateRef<any>) {
    if (this.pending) { return; }
    this.mode = 'book';
    this.resetForm();
    this.openDialog(tpl);
  }

  /**
   * Reschedule: available for 'Pending' and 'Approved' appointments only.
   */
  openReschedule(tpl: TemplateRef<any>) {
    if (!this.pending) { return; }
    if (this.pending.status !== 'Pending' && this.pending.status !== 'Approved') { return; }
    this.mode = 'reschedule';
    this.resetForm();
    this.openDialog(tpl);
  }

  /**
   * Edit: available for 'Pending' appointments only.
   * In live mode (useMock=false): disabled with tooltip (no student-facing edit endpoint in API).
   * In mock mode: opens the edit dialog pre-populated with the pending appointment's details.
   */
  editAppointment(a: Appointment, tpl: TemplateRef<any>) {
    if (!a || a.status !== 'Pending') { return; }
    // Guard: only allow editing own appointment
    if (this.profile && a.studentId && a.studentId !== this.profile.idNumber) { return; }
    this.editDisabledInLive = !this.guidance.useMock;
    if (!this.guidance.useMock) {
      // Show disabled state — backend dependency: no student-facing edit endpoint exists.
      return;
    }
    this.mode = 'edit';
    this.resetForm();
    // Pre-populate with the appointment's current values
    this.form.typeId = a.counselingTypeId;
    this.form.date = a.date;
    this.form.notes = a.notes;
    // Load slots for the current date so the user can pick a new time
    this.slotsLoading = true;
    this.guidance.getSlots(this.counselor.id, a.date).subscribe(
      s => { this.slots = s; this.slotsLoading = false; },
      e => { this.formError = (e && e.message) ? e.message : 'Could not load time slots.'; this.slotsLoading = false; }
    );
    this.openDialog(tpl);
  }

  /**
   * Confirm an 'Approved' appointment.
   * MOCK: sets status to 'Completed' locally.
   * LIVE: calls PUT /api/appointments/{id}/student-confirm, then sends student notification.
   * Counselor notification is NOT sent (NotificationDto has no employeeID — backend dependency).
   */
  confirmAppointment(a: Appointment) {
    if (!a || a.status !== 'Approved') { return; }
    this.saving = true;
    this.error = '';
    this.guidance.studentConfirm(a.id).subscribe(
      () => {
        this.saving = false;
        this.notice = 'Appointment confirmed.';
        this.refresh();
      },
      e => {
        this.saving = false;
        this.error = (e && e.message) ? e.message : 'Could not confirm the appointment. Please try again.';
      }
    );
  }

  private openDialog(tpl: TemplateRef<any>) {
    this.dialogRef = this.dialog.open(tpl, { width: '480px', maxWidth: '95vw', disableClose: true });
    this.dialogRef.afterClosed().subscribe(() => this.dialogRef = null);
  }

  closeForm() {
    if (this.saving) { return; }
    if (this.dialogRef) { this.dialogRef.close(); }
  }

  private resetForm() {
    this.form = { typeId: '', date: '', notes: '' };
    this.minDate = this.guidance.today();
    this.slots = [];
    this.selected = null;
    this.formError = '';
  }

  onDateChange() {
    this.selected = null;
    this.slots = [];
    this.formError = '';
    if (!this.form.date) { return; }
    if (this.form.date < this.minDate) { this.formError = 'Please choose today or a later date.'; return; }
    if (this.guidance.isWeekend(this.form.date)) { this.formError = 'Appointments are not available on weekends.'; return; }
    this.slotsLoading = true;
    this.guidance.getSlots(this.counselor.id, this.form.date).subscribe(
      s => { this.slots = s; this.slotsLoading = false; },
      e => { this.formError = (e && e.message) ? e.message : 'Could not load time slots.'; this.slotsLoading = false; }
    );
  }

  /** Only 'Available' slots can be selected; 'Unavailable' and 'Own' are disabled. */
  pick(s: TimeSlot) { if (s.status === 'Available') { this.selected = s; } }

  get canSubmit(): boolean {
    if (this.mode === 'edit') {
      // Edit: requires date, typeId, notes (and optional new slot)
      return !!this.form.date && !!this.form.typeId && !!this.form.notes.trim() && !this.saving;
    }
    return !!this.selected && !!this.form.date && !this.saving &&
      (this.mode === 'reschedule' || (!!this.form.typeId && !!this.form.notes.trim()));
  }

  submit() {
    if (!this.canSubmit) { return; }

    if (this.mode === 'edit') {
      this.submitEdit();
      return;
    }

    const s = this.selected;
    this.saving = true;
    this.formError = '';
    const request$ = this.mode === 'book'
      ? this.guidance.book({
        counselorId: this.counselor.id, counselingTypeId: this.form.typeId, date: this.form.date,
        startTime: s.startTime, endTime: s.endTime, notes: this.form.notes.trim()
      })
      : this.guidance.reschedule(this.pending.id, { date: this.form.date, startTime: s.startTime, endTime: s.endTime });

    request$.subscribe(
      a => {
        this.saving = false;
        if (this.dialogRef) { this.dialogRef.close(); }
        this.notice = (this.mode === 'book' ? 'Appointment booked for ' : 'Appointment moved to ') +
          a.date + ' at ' + this.guidance.formatTime(a.startTime) + '.';
        this.cursor = this.parse(a.date);
        this.refresh();
      },
      e => {
        this.saving = false;
        this.formError = (e && e.message) ? e.message : 'Something went wrong. Please try again.';
      }
    );
  }

  private submitEdit() {
    // Only available in mock mode (no student-facing edit endpoint in live API).
    if (!this.guidance.useMock) { return; }
    if (!this.pending || this.pending.status !== 'Pending') { return; }
    // Guard: only allow editing own appointment
    if (this.profile && this.pending.studentId && this.pending.studentId !== this.profile.idNumber) { return; }

    this.saving = true;
    this.formError = '';

    // Apply edits in-place to the mock store via service's internal mock
    const appt = this.pending;
    appt.counselingTypeId = this.form.typeId;
    appt.counselingTypeName = (this.types.find(t => t.id === this.form.typeId) || { name: '' }).name;
    appt.date = this.form.date;
    appt.notes = this.form.notes.trim();
    if (this.selected) {
      appt.startTime = this.selected.startTime;
      appt.endTime = this.selected.endTime;
    }
    // Status stays 'Pending'

    this.saving = false;
    if (this.dialogRef) { this.dialogRef.close(); }
    this.notice = 'Appointment updated.';
    this.cursor = this.parse(appt.date);
    this.refresh();
  }

  dismissNotice() { this.notice = ''; }

  // ------------------------------------------------------------------ helpers

  private startOfWeek(d: Date): Date {
    const back = (d.getDay() + 6) % 7;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - back);
  }

  private pad(n: number): string { return n < 10 ? '0' + n : '' + n; }
  private toIso(d: Date): string { return d.getFullYear() + '-' + this.pad(d.getMonth() + 1) + '-' + this.pad(d.getDate()); }
  private parse(s: string): Date { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  private toMin(t: string): number { const p = t.split(':'); return (+p[0]) * 60 + (+p[1]); }
  private fromMin(m: number): string { return this.pad(Math.floor(m / 60)) + ':' + this.pad(m % 60); }
}
