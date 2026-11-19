# Handover: Appointment Draft Safety + Independent Follow-ups

## Status
- Integration branch: `integration/appointment-followups-preserved`
- Base: latest `main` at `12cc13477f854a82e84a48916777ac0024a92000`
- `main` has not been changed.
- Integration changes are committed on this branch only.
- No local build or browser/API testing has been run from this remote workspace. GitHub reported no workflow runs or status checks for the latest commit at the time of review.

## What changed

### Appointment draft persistence
- Draft save/update payloads deliberately send `appointmentDate`, `startTime`, and `endTime` as null so a saved draft does not reserve a counselor slot.
- The selected date/time are stored in tab-scoped `sessionStorage` under a student/draft-specific key.
- Opening a draft restores the saved date and time, and refreshes availability. A prior slot is selected again only if it is still marked Available.
- A submit-only PUT (`updateDraftForSubmit`) sends the selected date/time immediately before the submit endpoint is called.
- The session selection is cleared after successful submission or draft deletion.

### Slot request race protection
- Each slot request is assigned a sequence number.
- Results from an older date selection are ignored if a newer request was made.
- Closing the dialog, resetting it, deleting/cancelling a draft, or destroying the component invalidates outstanding requests.
- Follow-up reschedule slot lookups use the follow-up's counselor ID when available.

### Follow-up separation
- Recent appointments now load from the appointments endpoint only.
- Follow-ups and reschedule-request state load independently, so a follow-up endpoint failure does not prevent normal appointment history from loading.
- Follow-ups are displayed in their own section with a retry state.
- Successful follow-up reschedule requests refresh the follow-up list, not the normal appointment history.

### Counselor schedule availability
- Slot lookup now calls `GET counselor-schedules/availability` with `employeeId`, `startDate`, and `endDate` (the selected date).
- UI availability is mapped from the API's `isAvailable` field rather than inferred from appointment records or fixed office hours.

## Files touched
- `src/app/guidance/appointment-draft.service.ts`
- `src/app/guidance/appointment-history/appointment-history.component.ts`
- `src/app/guidance/appointment-history/appointment-history.component.html`
- `src/app/guidance/counsellink.api.ts`
- `src/app/guidance/guidance.service.ts`
- `src/app/guidance/guidance.models.ts`

## API contracts that still need verification
The code assumes these endpoints/fields exist and are accessible for the authenticated student:
- `GET /api/counselor-schedules/availability?employeeId=...&startDate=...&endDate=...` with `startTime`, `endTime`, and `isAvailable`.
- `GET /api/follow-ups/student?idNumber=...&view=Active`.
- `GET /api/follow-ups/reschedule-requests/student?idNumber=...`.
- `POST /api/follow-ups/{followUpId}/reschedule-requests` with `idNumber`, `requestedStartAt`, `requestedEndAt`, and `requestNote`.

Confirm these against the current backend Swagger and test authorization/ownership server-side. Frontend filtering is not a substitute for API access controls.

## Local validation required
1. Run `npm install` if dependencies are not installed, then `npm run build`.
2. Verify draft save/update requests contain null appointment date/time and selection is preserved in sessionStorage.
3. Reopen a draft: date picker should show the restored date; time should auto-select only if still Available.
4. Rapidly change dates and verify the last request wins.
5. Close the dialog while loading slots; verify no stale response changes the next dialog.
6. Submit a draft: verify the submit-only PUT contains the actual date/time and the submit POST succeeds.
7. Test pending-appointment guard and server conflict responses.
8. Confirm normal appointment history still loads if the follow-up endpoint fails.
9. Confirm active follow-ups, persisted pending reschedule state, and the reschedule-request POST.
10. Test responsive layout and both follow-up and draft action buttons.

## Caveats
- `sessionStorage` is tab-scoped. If storage is unavailable or cleared, preferred date/time may not restore; the student must reselect.
- The schedule-availability and follow-up endpoint contracts have not been independently confirmed here.
- Do not merge into `main` until the local build and API/UI regression checks pass.
