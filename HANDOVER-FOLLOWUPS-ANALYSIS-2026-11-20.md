# Handover — Follow-up Appointments: Current Logic, Empty State, and Next Steps
**Date:** 2026-11-20  
**Branch:** `integration/appointment-followups-preserved`  
**Scope:** Student Appointment History > Follow-Up Appointments section, integration branch code, and uploaded Swagger dated 2026-11-14.

## Executive summary
There is some real follow-up logic in the student history page, but it is currently a small read/display/reschedule-request integration—not a complete follow-up lifecycle feature. The empty state is likely intentional if the student's records are Cancelled or Completed, because the UI asks the backend for `view=Active`. In the counselor management screenshot/context, the same student showed two follow-ups (one Cancelled, one Completed) and Active follow-ups = 0, which is consistent with the student view saying `No active follow-ups.`

However, the API paths currently used by this frontend are **not present in the uploaded Swagger (2026-11-14)**. They must be verified against the deployed backend before we conclude that the query or API is working correctly.

## Current frontend behavior (confirmed from branch code)

### Initialization
`appointment-history.component.ts` calls `loadFollowUps()` during `ngOnInit()`, independently of `load()` for regular appointments, booking context, and saved drafts.

### Data flow
1. `GuidanceService.getFollowUpHistory()` obtains the student profile.
2. `CounsellinkApi.getFollowUpHistory(profile)` calls `studentFollowUps(profile)`.
3. `studentFollowUps` sends GET `follow-ups/student` with query `idNumber=<student id>&view=Active`.
4. It then calls GET `follow-ups/reschedule-requests/student` with `idNumber=<student id>`.
5. If the reschedule-request lookup fails, it is caught and treated as an empty request list (this may hide that endpoint's failure).
6. Follow-up rows are mapped to appointment-like models and pending reschedule state is overlaid.
7. The component renders either loading, an error + Retry button, the empty state, or a table.

### Status mapping
- Status values containing cancel -> Cancelled
- completed/done -> Completed
- no-show -> No-show
- pending/request -> Pending
- approved/confirmed -> Scheduled
- A pending reschedule request -> Reschedule Pending

### Available action
A reschedule action is rendered only for rows with status Scheduled, Pending, or Approved, and no pending reschedule. Reschedule submission uses POST `follow-ups/{followUpId}/reschedule-requests`, then reloads follow-up history. This is request-for-approval, not direct booking.

### What is not implemented here
- This section does not create follow-ups. Creation/scheduling appears to be handled from the counselor-side follow-up workflow, not this student history section.
- No history toggle/filter for cancelled/completed follow-ups; it requests only Active.
- No detailed report/session data in this table.
- Reschedule requests are not fully surfaced in a separate history list here.
- No confirmed end-to-end verification of follow-up endpoints in a live browser/backend.

## Why the section may be empty
### Most likely, based on visible records
Counselor follow-up details previously showed:
- Follow-Up #1: Cancelled
- Follow-Up #2: Completed
- Active follow-ups: 0

Those statuses naturally do not qualify as active. The student section requests `view=Active`, so it may legitimately return no rows and display `No active follow-ups.`

### Alternative causes still unverified
- The endpoint may not recognize the query parameter/value `view=Active`.
- Student ID/query contract or response shape may differ from what the frontend assumes.
- The follow-up API route may not be deployed or documented.
- Backend may return a response envelope the helper `rows(body)` does not extract correctly.
- Endpoint may return an error; the component should show an error state, but the reschedule-request endpoint failure is silently converted to no pending requests.

## Swagger comparison
The uploaded Swagger file dated 2026-11-14 does **not** contain these routes:
- `GET /api/follow-ups/student`
- `GET /api/follow-ups/reschedule-requests/student`
- `POST /api/follow-ups/{followUpId}/reschedule-requests`

It does document other follow-up-related endpoints, including:
- `/api/clinical/follow-ups` (clinical/session follow-up CRUD/select)
- `/api/counselor-records/follow-ups` (counselor records lookup)

These are not proven substitutes for the student follow-up endpoints currently wired into the frontend. Do not swap endpoints without examining the request/response schema and backend semantics.

## Recommended next steps (in order)

### 1. Verify the current student endpoint live — no code changes
Open the student Appointment History page and DevTools > Network:
- Filter by `follow-ups`.
- Inspect the GET request to `follow-ups/student`.
- Record URL/query parameters, HTTP status, response body, and response envelope.
- Confirm the student ID used is the logged-in student's ID.
- Check whether the response has rows and what their status fields are.
- Inspect the reschedule-requests endpoint separately; distinguish a failing endpoint from a successful empty list.

### 2. Confirm Active semantics with backend
Ask backend owner to verify:
- Does `view=Active` exclude Completed and Cancelled?
- Which statuses are considered active?
- Is the student endpoint deployed and intentionally absent from Swagger?
- What exact response shape and status fields are returned?
- What ownership/auth checks are performed?

### 3. Improve the UI once API behavior is confirmed
Recommended small enhancement:
- Keep default Active view.
- Add a collapsible **History** view for Completed and Cancelled follow-ups (if backend can return them safely).
- Show a useful explanation when there are no active follow-ups, e.g. “You have no active follow-ups. Completed and cancelled sessions are available in History.”
- Do not present an API failure as an empty state.
- Consider making reschedule-request endpoint failures visible separately rather than silently treating them as no pending requests.

### 4. Verify rescheduling end-to-end
For a Scheduled follow-up:
- Confirm the reschedule action appears.
- Select an available counselor slot.
- Submit a request.
- Verify POST payload and response.
- Confirm row becomes Reschedule Pending after refresh.
- Confirm pending state is read from the request endpoint.
- Verify counselor approval/rejection and the final status transition on both sides.

### 5. Regression validation
- Run `npm run build` after the previously added RxJS import fix.
- Verify normal appointment history still works even if follow-up APIs fail.
- Verify the empty state, error state, retry, and populated state.
- Verify the latest heading-icon removal remains in place.

## Recent branch updates
- Removed the decorative `event_repeat` icon from the Follow-Up Appointments section heading (commit `d82fc63`).
- Earlier integration includes independent follow-up loading, status mapping, reschedule-request UI/API wiring, draft persistence, and slot-request race protection.
- The first local build reported a missing RxJS `map` import, corrected in commit `b294121`; local build has not yet been confirmed passing after the correction.

## Do not do yet
- Do not merge to main.
- Do not replace undocumented student follow-up endpoints with clinical follow-up endpoints based solely on matching names.
- Do not implement a history tab until backend response semantics are confirmed.
