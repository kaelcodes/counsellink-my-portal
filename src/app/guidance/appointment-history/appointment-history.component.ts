import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GuidanceService } from '../guidance.service';
import { AppointmentDraftService } from '../appointment-draft.service';
import { GlobalService } from '../../global.service';
import Swal from 'sweetalert2';
import {
  Appointment, AppointmentDraft, APPOINTMENT_STATUSES, AppointmentStatus, BookingRequest,
  Counselor, CounselingType, RescheduleRequest, StudentProfile, TimeSlot
} from '../guidance.models';

@Component({
  selector: 'app-appointment-history',
  templateUrl: './appointment-history.component.html',
  styleUrls: ['./appointment-history.component.scss']
})
export class AppointmentHistoryComponent implements OnInit, OnDestroy {
  readonly statuses = APPOINTMENT_STATUSES;
  readonly pageSizes = [5, 10, 25];

  items: Appointment[] = [];
  followUps: Appointment[] = [];
  followUpsLoading = false;
  followUpsError = '';
  total = 0;
  pageIndex = 0;
  pageSize = 5;
  status: AppointmentStatus | 'All' = 'All';
  search = '';

  loading = true;
  error = '';

  // ---- booking context (counselor + types) for the New Appointment / Reschedule dialogs
  profile: StudentProfile = null;
  counselor: Counselor = null;
  types: CounselingType[] = [];       // AppointmentType — not shown in the booking form
  concernTypes: CounselingType[] = []; // ConcernType — shown in the booking dropdown
  counselorError = '';

  // ---- booking / reschedule / cancel dialog state
  private dialogRef: MatDialogRef<any> = null;
  mode: 'book' | 'reschedule' = 'book';
  editingConcernDetails = false;
  target: Appointment = null;
  form = { concernTypeId: '', date: '', notes: '' };
  minDate = '';
  datePickerValue: Date = null;
  slots: TimeSlot[] = [];
  slotsLoading = false;
  selected: TimeSlot = null;
  formError = '';
  saving = false;
  actionLoading = false;
  actionError = '';
  notice = '';
  confirmTarget: Appointment = null;
  followUpRescheduleNote = '';

  // ---- IDs of appointments confirmed by the student this session (backend keeps status 'Confirmed'
  //       which maps to 'Approved' in labelFor; track confirmed IDs to suppress the Confirm button).
  confirmedIds: Set<number> = new Set<number>();
  // IDs of appointments where the STUDENT submitted a reschedule request this session.
  // For these, the appointment shows as "Waiting for counselor" — no Accept Reschedule button.
  rescheduledByStudentIds: Set<number> = new Set<number>();

  // ---- Draft state --------------------------------------------------------
  drafts: AppointmentDraft[] = [];
  /** The draft currently being edited; null in normal booking mode. */
  activeDraft: AppointmentDraft | null = null;
  draftSaving = false;
  draftError = '';
  /** Snapshot used to warn before discarding edits to an existing draft. */
  private draftEditSnapshot = '';
  /** True when the form dialog is open in draft-edit mode. */
  get isDraftMode(): boolean { return this.activeDraft !== null; }

  /** Slot selected before a draft was saved; consumed once after availability loads. */
  _pendingRestoreSlot: { startTime: string; endTime: string } | null = null;
  /** Keeps the hint visible during loading while the pending restore is consumed. */
  _restoreHintSlot: { startTime: string; endTime: string } | null = null;
  // True until the first successful or failed load completes — drives the Swal loading popup.
  private firstLoad = true;

  @ViewChild('confirmDialog', { static: false }) confirmDialogTpl: TemplateRef<any>;

  private typing$ = new Subject<void>();
  private sub: Subscription;
  private requestNo = 0;
  private slotRequestNo = 0;

  constructor(private guidance: GuidanceService, private dialog: MatDialog, private draftSvc: AppointmentDraftService, private globalSvc: GlobalService) { }

  private get studentId(): string {
    return String(this.globalSvc.requestid() || '');
  }

  ngOnInit() {
    this.sub = this.typing$.pipe(debounceTime(300)).subscribe(() => {
      this.pageIndex = 0;
      this.load();
    });
    this.load();
    this.loadFollowUps();
    this.loadBookingContext();
    this.loadDrafts();
  }

  ngOnDestroy() {
    if (this.sub) { this.sub.unsubscribe(); }
    this.slotRequestNo++;
  }

  loadFollowUps() {
    this.followUpsLoading = true;
    this.followUpsError = '';
    this.guidance.getFollowUpHistory().subscribe(
      rows => { this.followUps = rows || []; this.followUpsLoading = false; },
      e => {
        this.followUpsError = (e && e.message) ? e.message : 'Could not load follow-ups.';
        this.followUpsLoading = false;
      }
    );
  }

  load() {
    const no = ++this.requestNo;
    this.loading = true;
    this.error = '';
    // Show the Swal loading popup only on the initial page entry.
    if (this.firstLoad) {
      Swal({ title: 'Loading appointments\u2026', allowOutsideClick: false, onOpen: () => { Swal.showLoading(); } });
    }
    this.guidance.getHistory({
      pageIndex: this.pageIndex, pageSize: this.pageSize, status: this.status, search: this.search
    }).subscribe(
      r => {
        if (no !== this.requestNo) { return; }
        this.items = r.items;
        this.total = r.total;
        this.loading = false;
        if (this.firstLoad) { this.firstLoad = false; Swal.close(); }
      },
      e => {
        if (no !== this.requestNo) { return; }
        this.error = (e && e.message) ? e.message : 'Could not load your appointment history.';
        this.loading = false;
        if (this.firstLoad) { this.firstLoad = false; Swal.close(); }
      }
    );
  }

  /**
   * Loads the counselor + concern types needed by the New Appointment / Reschedule dialogs.
   * Uses GET /api/constants/ConcernType for the concern dropdown.
   * A failure surfaces as counselorError (disables booking) and is never silently mocked.
   */
  loadBookingContext() {
    this.guidance.getStudentProfile().pipe(
      switchMap(p => {
        this.profile = p;
        return forkJoin(
          this.guidance.getCounselor(p.departmentCode),
          this.guidance.getConcernTypes()
        );
      })
    ).subscribe(
      res => {
        this.counselor = res[0];
        this.concernTypes = res[1];
      },
      e => {
        this.counselorError = (e && e.message) ? e.message : 'Could not load counselor info; booking is unavailable.';
      }
    );
  }

  onSearchTyped() { this.typing$.next(); }

  onFilterChanged() { this.pageIndex = 0; this.load(); }

  onPage(e: { pageIndex: number, pageSize: number }) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.load();
  }

  time(a: Appointment): string {
    return this.guidance.formatTime(a.startTime) + ' - ' + this.guidance.formatTime(a.endTime);
  }

  statusClass(a: Appointment): string { return 'st-' + a.status.toLowerCase().replace(/-/g, ''); }

  isFollowUp(a: Appointment): boolean { return !!(a && a.isFollowUp); }

  displayStatus(a: Appointment): string { return a && a.isFollowUp && a.status === 'Reschedule Pending' ? 'Reschedule Pending' : a.status; }

  /** True only for appointments created by the counselor. */
  isCounselorInitiated(a: Appointment): boolean {
    return (a.counselingTypeName || '').trim().toLowerCase() === 'counselor initiated';
  }

  // ----------------------------------------------------------- booking dialog

  openBook(tpl: TemplateRef<any>) {
    this.mode = 'book';
    this.target = null;
    this.activeDraft = null;   // ensure normal booking mode
    this.resetForm();
    this.openDialog(tpl);
  }

  openReschedule(a: Appointment, tpl: TemplateRef<any>) {
    this.target = a;
    this.activeDraft = null;   // ensure normal reschedule mode
    this.mode = 'reschedule';
    this.resetForm();
    this.editingConcernDetails = !this.isCounselorInitiated(a) && !this.isFollowUp(a);
    this.followUpRescheduleNote = '';
    if (this.editingConcernDetails) {
      this.form.concernTypeId = a.concernTypeId || (this.concernTypes.find(t => t.name === a.concernTypeName) || { id: '' }).id;
      this.form.notes = a.notes || '';
      this.form.date = a.date;
      this.datePickerValue = this.parseDateInput(a.date);
      this.onDateChange();
    }
    this.openDialog(tpl);
  }

  // ---------------------------------------------------------------- drafts

  private loadDrafts() {
    const sid = this.studentId;
    if (!sid) { return; }
    this.draftSvc.getDrafts(sid).subscribe(
      d => { this.drafts = d; },
      () => { /* non-fatal: drafts section stays empty */ }
    );
  }

  /**
   * Save current booking form as a draft (new or update existing).
   * Never calls the appointment API. Does not reserve a slot.
   */
  saveDraft(tpl: TemplateRef<any>) {
    if (this.draftSaving) { return; }
    this.draftSaving = true;
    this.draftError = '';

    const concernName = (this.concernTypes.find(c => c.id === this.form.concernTypeId) || { name: '' }).name;
    const payload: Omit<AppointmentDraft, 'id' | 'savedAt'> = {
      // Counselor: prefer live-loaded value; fall back to whatever is already in the draft.
      counselorId:    (this.counselor && this.counselor.id)
                        ? this.counselor.id
                        : (this.activeDraft ? this.activeDraft.counselorId : ''),
      counselorName:  (this.counselor && this.counselor.name)
                        ? this.counselor.name
                        : (this.activeDraft ? this.activeDraft.counselorName : ''),
      // Concern: form value wins; fall back to saved draft value when the field is blank.
      concernTypeId:  this.form.concernTypeId
                        || (this.activeDraft ? this.activeDraft.concernTypeId : ''),
      concernTypeName: concernName
                        || (this.activeDraft ? this.activeDraft.concernTypeName : ''),
      date:      this.form.date,
      startTime: this.selected ? this.selected.startTime : (this.activeDraft ? this.activeDraft.startTime : ''),
      endTime:   this.selected ? this.selected.endTime   : (this.activeDraft ? this.activeDraft.endTime   : ''),
      notes:     this.form.notes.trim()
                   || (this.activeDraft ? this.activeDraft.notes : ''),
      // Grade/year from the authenticated student's profile — required by the backend for submission.
      gradeOrYearLevel: this.profile ? this.profile.yearLevel
                          : (this.activeDraft ? this.activeDraft.gradeOrYearLevel : null),
    };

    const op = this.activeDraft
      ? this.draftSvc.updateDraft({ ...payload, id: this.activeDraft.id, savedAt: this.activeDraft.savedAt }, this.studentId)
      : this.draftSvc.saveDraft(payload, this.studentId);

    op.subscribe(
      saved => {
        this.draftSaving = false;
        this.activeDraft = saved;
        this.draftSvc.saveSelection(this.studentId, saved.id, payload.date, payload.startTime, payload.endTime);
        this.loadDrafts();
        if (this.dialogRef) { this.dialogRef.close(); }
        this.notice = 'Draft saved. You can reopen it from the Drafts section below.';
      },
      e => {
        this.draftSaving = false;
        this.draftError = (e && e.message) ? e.message : 'Could not save draft. Please try again.';
      }
    );
  }

  /** Open a saved draft into the booking form for editing. */
  openDraft(draft: AppointmentDraft, tpl: TemplateRef<any>) {
    this.mode = 'book';
    this.target = null;
    this.activeDraft = draft;
    this.draftError = '';

    // Restore the student's preferred date and time from sessionStorage.
    // The API row stores null for date/time (drafts must not block counselor availability),
    // so sessionStorage is the authoritative source for these selections.
    const sel = this.draftSvc.restoreSelection(this.studentId, draft.id);
    const restoredDate      = sel ? sel.date      : '';
    const restoredStartTime = sel ? sel.startTime : '';
    const restoredEndTime   = sel ? sel.endTime   : '';

    // Seed the edit snapshot from sessionStorage-restored values so the dirty-check
    // correctly detects changes relative to what the student last saved.
    this.draftEditSnapshot = JSON.stringify({
      concernTypeId: draft.concernTypeId || '',
      date:      restoredDate,
      notes:     draft.notes || '',
      startTime: restoredStartTime,
      endTime:   restoredEndTime
    });

    // Populate form from draft values, using sessionStorage for date.
    this.form = { concernTypeId: draft.concernTypeId, date: restoredDate, notes: draft.notes };
    this.minDate = this.guidance.today();
    this.slots = [];
    this.selected = null;
    this.formError = '';

    // If a time slot was previously selected, store it so onDateChange can auto-select it
    // once the available slots have loaded. It will only be re-selected if the slot is
    // still Available — if it has since been taken, the student must choose again.
    this._pendingRestoreSlot = (restoredStartTime || restoredEndTime)
      ? { startTime: restoredStartTime, endTime: restoredEndTime }
      : null;
    // _restoreHintSlot drives the template hint separately so the hint stays visible
    // even after _pendingRestoreSlot is cleared on onDateChange() entry.
    this._restoreHintSlot = this._pendingRestoreSlot;

    // Trigger slot loading if a date is restored; availability is refreshed from the API.
    if (restoredDate) { this.onDateChange(); }

    this.openDialog(tpl);
  }

  /**
   * Submit Draft — calls updateDraft (PUT) then submitDraft (POST .../submit { idNumber }).
   * The backend transitions status 5 → 1 (Requested). No deleteDraft call needed.
   * On success, refreshes both the drafts list and the appointments list.
   */
  submitDraft() {
    if (this.draftSaving || !this.activeDraft) { return; }

    // Validate that the student has selected a slot with both start and end times.
    if (!this.selected || !this.selected.startTime || !this.selected.endTime) {
      this.formError = 'Please select an available time slot (with start and end time) before submitting.';
      return;
    }

    // Build the merge now — before the Swal prompt — so we can validate all required fields
    // while the user is still looking at the form.
    const concernName = (this.concernTypes.find(c => c.id === this.form.concernTypeId) || { name: '' }).name;
    const mergedCounselorId   = (this.counselor && this.counselor.id)   ? this.counselor.id   : this.activeDraft.counselorId;
    const mergedConcernTypeId = this.form.concernTypeId                 || this.activeDraft.concernTypeId;
    const mergedNotes         = this.form.notes.trim()                  || this.activeDraft.notes;
    const mergedDate          = this.form.date                          || this.activeDraft.date;

    // Validate all five backend-required fields before showing the confirmation dialog.
    const missing: string[] = [];
    if (!mergedCounselorId)   { missing.push('counselor'); }
    if (!mergedDate)          { missing.push('date'); }
    if (!this.selected.startTime) { missing.push('start time'); }
    if (!this.selected.endTime)   { missing.push('end time'); }
    if (!mergedNotes)         { missing.push('reason / concern description'); }
    if (!mergedConcernTypeId) { missing.push('concern type'); }

    if (missing.length > 0) {
      this.formError = 'Please provide: ' + missing.join(', ') + '.';
      return;
    }

    Swal({
      title: 'Send appointment request?',
      html: 'This will send your counseling request to the guidance counselor for review.',
      type: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, send it',
      cancelButtonText: 'Not yet'
    }).then(result => {
      if (!result.value) { return; }
      this.draftSaving = true;
      this.draftError = '';

      const latestDraft: AppointmentDraft = {
        ...this.activeDraft,
        counselorId:     mergedCounselorId,
        counselorName:   (this.counselor && this.counselor.name) ? this.counselor.name : this.activeDraft.counselorName,
        concernTypeId:   mergedConcernTypeId,
        concernTypeName: concernName || this.activeDraft.concernTypeName,
        date:            mergedDate,
        // endTime from the confirmed slot only — backend returns EndTime but no AppointmentEndTime
        startTime:       this.selected.startTime,
        endTime:         this.selected.endTime,
        notes:           mergedNotes,
        // Grade/year from live profile; fall back to what was already stored in the draft
        gradeOrYearLevel: this.profile ? this.profile.yearLevel : this.activeDraft.gradeOrYearLevel,
      };
      const sid = this.studentId;

      // Match the normal booking guard before using the separate draft-submit endpoint.
      // Fail closed if the active-appointment check cannot be completed.
      this.guidance.hasPendingAppointment().subscribe(
        hasPending => {
          if (hasPending) {
            this.draftSaving = false;
            this.draftError = 'You already have a pending appointment. Reschedule it or attend it before submitting another request.';
            return;
          }
          this.persistAndSubmitDraft(latestDraft, sid);
        },
        () => {
          this.draftSaving = false;
          this.draftError = 'Could not verify your current appointments. Please try again before submitting this draft.';
        }
      );
    });
  }

  /** Persist draft edits and submit only after the active-appointment precheck passes. */
  private persistAndSubmitDraft(latestDraft: AppointmentDraft, sid: string) {
    this.draftSvc.updateDraftForSubmit(latestDraft, sid).pipe(
      switchMap(() => this.draftSvc.submitDraft(latestDraft.id, sid))
    ).subscribe(
      () => {
        this.draftSaving = false;
        this.draftSvc.clearSelection(sid, latestDraft.id);
        this.activeDraft = null;
        if (this.dialogRef) { this.dialogRef.close(); }
        this.loadDrafts();
        this.load();
        this.notice = 'Appointment request sent to your counselor.';
      },
      e => {
        this.draftSaving = false;
        if (this.handlePendingRescheduleConflict(e)) {
          this.draftError = '';
        } else {
          this.draftError = (e && e.message) ? e.message : 'Could not submit the draft. Please try again.';
        }
      }
    );
  }

  /** Close the Edit Draft dialog without saving; confirm first if the student changed anything. */
  cancelDraftEdit() {
    if (this.saving || this.draftSaving || !this.activeDraft) { return; }

    const currentValues = JSON.stringify({
      concernTypeId: this.form.concernTypeId || '',
      date: this.form.date || '',
      notes: this.form.notes || '',
      startTime: (this.selected && this.selected.startTime) || this.activeDraft.startTime || '',
      endTime: (this.selected && this.selected.endTime) || this.activeDraft.endTime || ''
    });
    const hasChanges = currentValues !== this.draftEditSnapshot;

    const closeDialog = () => {
      this.slotRequestNo++;
      this.activeDraft = null;
      this.draftEditSnapshot = '';
      if (this.dialogRef) { this.dialogRef.close(); }
    };

    if (!hasChanges) {
      closeDialog();
      return;
    }

    Swal({
      title: 'Discard unsaved changes?',
      text: 'Your changes to this draft will not be saved.',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Discard Changes',
      cancelButtonText: 'Continue Editing'
    }).then(result => {
      if (result.value) { closeDialog(); }
    });
  }

  /**
   * Cancel/delete a draft — asks for confirmation then removes from the store.
   * "Cancel Draft" means deleting the draft, not cancelling a real appointment.
   */
  cancelDraft() {
    if (!this.activeDraft) { return; }
    const draftId = this.activeDraft.id;
    const sid = this.studentId;
    Swal({
      title: 'Delete this draft?',
      text: 'The draft will be permanently removed. This cannot be undone.',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete draft',
      cancelButtonText: 'Keep it'
    }).then(result => {
      if (!result.value) { return; }
      this.draftSvc.deleteDraft(draftId, sid).subscribe(() => {
        this.slotRequestNo++;
        this.draftSvc.clearSelection(sid, draftId);
        this.activeDraft = null;
        this.loadDrafts();
        if (this.dialogRef) { this.dialogRef.close(); }
        this.notice = 'Draft deleted.';
      });
    });
  }

  deleteDraftFromList(draft: AppointmentDraft) {
    const sid = this.studentId;
    Swal({
      title: 'Delete this draft?',
      text: 'The draft will be permanently removed.',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (!result.value) { return; }
      this.draftSvc.deleteDraft(draft.id, sid).subscribe(() => { this.draftSvc.clearSelection(sid, draft.id); this.loadDrafts(); });
    });
  }

  draftTime(d: AppointmentDraft): string {
    if (!d.startTime) { return '—'; }
    return this.guidance.formatTime(d.startTime) + (d.endTime ? ' – ' + this.guidance.formatTime(d.endTime) : '');
  }

  /** Accept a counselor-initiated Pending appointment using the API's counselor confirm route. */
  confirmCounselorInitiated(a: Appointment) {
    if (this.actionLoading || !this.isCounselorInitiated(a) || a.status !== 'Pending') { return; }
    this.actionLoading = true;
    this.actionError = '';
    this.notice = '';
    this.guidance.confirmCounselorInitiated(a).subscribe(
      (updated: Appointment) => {
        this.actionLoading = false;
        const idx = this.items.findIndex(x => x.id === updated.id);
        if (idx >= 0) { this.items[idx] = updated; }
        this.notice = 'Counselor-initiated appointment accepted.';
        this.load();
      },
      e => {
        this.actionLoading = false;
        this.actionError = (e && e.message) ? e.message : 'Could not accept the appointment.';
      }
    );
  }

  /** Confirm an 'Approved' (counselor-proposed) appointment: PUT /api/appointments/{id}/student-confirm. */
  confirmAppointment(a: Appointment) {
    // Only counselor-initiated appointments approved by the counselor require student confirmation.
    // Student-initiated appointments become confirmed as soon as the counselor approves them.
    if (this.actionLoading || this.confirmedIds.has(a.id) ||
        !this.isCounselorInitiated(a) || a.status !== 'Approved') { return; }
    this.actionLoading = true;
    this.actionError = '';
    this.notice = '';
    this.guidance.studentConfirm(a.id).subscribe(
      (updated: Appointment) => {
        this.actionLoading = false;
        // Track this ID so the Confirm button is hidden even though the backend status
        // stays 'Confirmed' (mapped to 'Approved' by labelFor — no distinct post-confirm status).
        this.confirmedIds.add(a.id);
        // Patch the item in the current list to reflect the returned state immediately.
        const idx = this.items.findIndex(x => x.id === updated.id);
        if (idx >= 0) { this.items[idx] = updated; }
        this.notice = 'Appointment confirmed. Your counselor will be notified.';
        // Re-fetch the list to sync with the backend.
        this.load();
      },
      e => {
        this.actionLoading = false;
        this.actionError = (e && e.message) ? e.message : 'Confirmation failed.';
      }
    );
  }

  /** Accept a counselor-proposed reschedule: PUT /api/appointments/{id}/accept-reschedule. */
  acceptReschedule(a: Appointment) {
    if (this.actionLoading) { return; }
    this.actionLoading = true;
    this.actionError = '';
    this.guidance.acceptReschedule(a.id).subscribe(
      () => {
        this.actionLoading = false;
        this.load();
      },
      e => {
        this.actionLoading = false;
        this.actionError = (e && e.message) ? e.message : 'Could not accept the reschedule.';
      }
    );
  }

  /** Open the cancel-confirmation dialog for an appointment (Cancel = delete). */
  requestDelete(a: Appointment) {
    this.confirmTarget = a;
    this.openDialog(this.confirmDialogTpl);
  }

  /** Delete the selected appointment: DELETE /api/appointments/{id} (path id only). */
  confirmDelete() {
    if (this.saving || !this.confirmTarget) { return; }
    this.saving = true;
    this.actionError = '';
    this.guidance.deleteAppointment(this.confirmTarget.id).subscribe(
      () => {
        this.saving = false;
        if (this.dialogRef) { this.dialogRef.close(); }
        this.load();
      },
      e => {
        this.saving = false;
        this.actionError = (e && e.message) ? e.message : 'Could not cancel the appointment.';
      }
    );
  }

  /**
   * Turn the backend's pending-reschedule overlap response into a clear student-facing modal.
   * The conflicting slot is marked unavailable locally so the student cannot immediately
   * submit the same selection again.
   */
  private handlePendingRescheduleConflict(e: any): boolean {
    const message = String(
      (e && (e.message || (e.error && (e.error.message || e.error)))) || ''
    ).toLowerCase();

    if (message.indexOf('pending reschedule') < 0 || message.indexOf('overlap') < 0) {
      return false;
    }

    const conflictingStart = this.selected && this.selected.startTime;
    if (conflictingStart) {
      this.slots = this.slots.map(slot => slot.startTime === conflictingStart
        ? { ...slot, status: 'Unavailable' as 'Unavailable' }
        : slot);
    }
    this.selected = null;

    Swal({
      title: 'Time slot unavailable',
      text: 'Another appointment already has a pending reschedule request for this exact date and time. Please choose a different available time. The slot can be used again once that pending request has been resolved.',
      type: 'warning',
      confirmButtonText: 'Choose another time'
    });

    return true;
  }

  private openDialog(tpl: TemplateRef<any>) {
    this.dialogRef = this.dialog.open(tpl, { width: '480px', maxWidth: '95vw', disableClose: true });
    this.dialogRef.afterClosed().subscribe(() => { this.slotRequestNo++; this.dialogRef = null; });
  }

  closeForm() {
    if (this.saving) { return; }
    this.slotRequestNo++;
    if (this.dialogRef) { this.dialogRef.close(); }
  }

  private resetForm() {
    this.form = { concernTypeId: '', date: '', notes: '' };
    this.datePickerValue = null;
    this.minDate = this.guidance.today();
    this.slots = [];
    this.selected = null;
    this.formError = '';
    this.followUpRescheduleNote = '';
    this._pendingRestoreSlot = null;
    this._restoreHintSlot = null;
    this.slotRequestNo++;
  }


  /** Convert the API's yyyy-MM-dd value into a local Date without timezone shifting. */
  private parseDateInput(value: string): Date {
    if (!value) { return null; }
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) { return null; }
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  get minDateDate(): Date {
    return this.parseDateInput(this.minDate);
  }

  /** Keep the existing API/draft date format while using Angular Material's calendar UI. */
  onMaterialDateChange(value: Date) {
    if (!value) {
      this.form.date = '';
      this.onDateChange();
      return;
    }
    const year = value.getFullYear();
    const month = ('0' + (value.getMonth() + 1)).slice(-2);
    const day = ('0' + value.getDate()).slice(-2);
    this.form.date = year + '-' + month + '-' + day;
    this.onDateChange();
  }

  onDateChange() {
    this.selected = null;
    this.slots = [];
    this.formError = '';
    // Stamp this request so any callback from a previous in-flight call can be discarded.
    const slotNo = ++this.slotRequestNo;
    // Capture the restore slot and clear _pendingRestoreSlot immediately.
    // Clearing here ensures that subsequent manual date changes (each calling onDateChange)
    // capture null and cannot inherit the draft's restore slot for a different date.
    // _restoreHintSlot is kept alive separately to continue driving the template hint.
    const pendingSlot = this._pendingRestoreSlot;
    this._pendingRestoreSlot = null;
    if (!this.form.date) { this._restoreHintSlot = null; this.slotsLoading = false; return; }
    if (this.form.date < this.minDate) { this._restoreHintSlot = null; this.slotsLoading = false; this.formError = 'Please choose today or a later date.'; return; }
    if (this.guidance.isWeekend(this.form.date)) { this._restoreHintSlot = null; this.slotsLoading = false; this.formError = 'Appointments are not available on weekends.'; return; }
    const availabilityCounselorId = (this.isFollowUp(this.target) && this.target.counselorId) ? this.target.counselorId : (this.counselor && this.counselor.id);
    if (!availabilityCounselorId) {
      this._restoreHintSlot = null;
      this.slotsLoading = false;
      this.formError = this.counselorError || 'Counselor info is not available yet. Please close and try again.';
      return;
    }
    this.slotsLoading = true;
    this.guidance.getSlots(availabilityCounselorId, this.form.date).subscribe(
      s => {
        // Discard if a newer date selection has already superseded this request.
        if (slotNo !== this.slotRequestNo) { return; }
        this.slots = s;
        this.slotsLoading = false;
        // After slots load, try to restore the previously selected slot.
        // Auto-select only if the slot is still Available — if it is now Unavailable or
        // gone, the student must choose again (availability may have changed).
        if (pendingSlot && pendingSlot.startTime) {
          const match = this.slots.find(
            slot => slot.startTime === pendingSlot.startTime && slot.status === 'Available'
          );
          this.selected = match ? match : null;
        }
        // Clear the hint slot now that loading is done.
        this._restoreHintSlot = null;
      },
      e => {
        // Discard if superseded.
        if (slotNo !== this.slotRequestNo) { return; }
        this._restoreHintSlot = null;
        this.formError = (e && e.message) ? e.message : 'Could not load time slots.';
        this.slotsLoading = false;
      }
    );
  }

  /** Only 'Available' slots can be selected; 'Unavailable' and 'Own' are disabled. */
  pick(s: TimeSlot) { if (s.status === 'Available') { this.selected = s; } }

  slotLabel(s: TimeSlot): string {
    if (s.status === 'Own') { return 'Your appointment'; }
    if (s.status === 'Unavailable') { return 'Booked'; }
    return s.label;
  }

  get canSubmit(): boolean {
    if (this.mode === 'book') {
      return !!this.selected && !!this.form.date && !!this.form.concernTypeId && !!this.form.notes.trim() && !this.saving;
    }
    if (this.editingConcernDetails) {
      return !!this.selected && !!this.form.date && !!this.form.concernTypeId && !!this.form.notes.trim() && !this.saving;
    }
    return !!this.selected && !!this.form.date && !this.saving;
  }

  submit() {
    if (!this.canSubmit) { return; }
    const s = this.selected;
    this.saving = true;
    this.formError = '';

    if (this.mode === 'book') {
      const req: BookingRequest = {
        counselorId: this.counselor.id,
        counselingTypeId: '',        // appointmentTypeID — set to Student Initiated (1) in CounselLinkApi
        concernTypeId: this.form.concernTypeId,
        date: this.form.date,
        startTime: s.startTime,
        endTime: s.endTime,
        notes: this.form.notes.trim()
      };
      this.guidance.book(req).subscribe(
        () => {
          this.saving = false;
          if (this.dialogRef) { this.dialogRef.close(); }
          this.load();
        },
        e => {
          this.saving = false;
          if (this.handlePendingRescheduleConflict(e)) {
            this.formError = '';
          } else {
            this.formError = (e && e.message) ? e.message : 'Something went wrong. Please try again.';
          }
        }
      );
    } else {
      const req: RescheduleRequest = {
        date: this.form.date,
        startTime: s.startTime,
        endTime: s.endTime
      };
      if (this.isFollowUp(this.target)) {
        this.guidance.requestFollowUpReschedule(this.target.followUpId || this.target.id, req, this.followUpRescheduleNote.trim()).subscribe(
          () => {
            this.saving = false;
            if (this.dialogRef) { this.dialogRef.close(); }
            this.notice = 'Follow-up reschedule request sent. Waiting for counselor approval.';
            this.loadFollowUps();
          },
          e => {
            this.saving = false;
            this.formError = (e && e.message) ? e.message : 'Could not send the follow-up reschedule request. Please try again.';
          }
        );
        return;
      }
      const appointmentId = this.target.id;
      const submitReschedule = () => this.guidance.reschedule(appointmentId, req).subscribe(
        (updated: Appointment) => {
          this.saving = false;
          if (this.dialogRef) { this.dialogRef.close(); }
          this.rescheduledByStudentIds.add(appointmentId);
          const idx = this.items.findIndex(x => x.id === updated.id);
          if (idx >= 0) { this.items[idx] = updated; }
          this.notice = this.editingConcernDetails
            ? 'Changes submitted. Your updated appointment is waiting for counselor review.'
            : 'Reschedule request sent. Waiting for counselor confirmation.';
          this.load();
        },
        e => {
          this.saving = false;
          if (this.handlePendingRescheduleConflict(e)) {
            this.formError = '';
          } else {
            this.formError = (e && e.message) ? e.message : 'Something went wrong. Please try again.';
          }
        }
      );
      if (this.editingConcernDetails) {
        this.guidance.updateConcernDetails(appointmentId, this.form.concernTypeId, this.form.notes.trim()).subscribe(
          () => submitReschedule(),
          e => {
            this.saving = false;
            this.formError = (e && e.message) ? e.message : 'Could not update the concern details. Please try again.';
          }
        );
      } else {
        submitReschedule();
      }
    }
  }
}
