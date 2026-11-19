// Shapes used by the Guidance screens.
// Appointment field names are a proposal until the appointment table design arrives.

// 'Approved' is added to represent counselor-approved appointments (counselor has approved/confirmed it).
// labelFor() in counsellink.api.ts maps API status names containing 'approv' or 'confirm'
// (but NOT 'schedul' or 'pend') to 'Approved'.
export type AppointmentStatus = 'Pending' | 'Approved' | 'Scheduled' | 'Reschedule Pending' | 'Completed' | 'Rescheduled' | 'Cancelled' | 'No-show' | 'Draft';

// 'Own' is added to represent a slot already taken by the authenticated student themselves.
export type SlotStatus = 'Available' | 'Unavailable' | 'Own';

export const APPOINTMENT_STATUSES: AppointmentStatus[] = ['Pending', 'Approved', 'Scheduled', 'Reschedule Pending', 'Completed', 'Rescheduled', 'Cancelled', 'No-show'];

// Counselor office hours (from the counselor "My schedule" screen).
// 12:30 PM - 1:00 PM is the lunch break, so it is never offered as a slot.
export const OFFICE_HOURS = [
  { start: '07:30', end: '12:30' },
  { start: '13:00', end: '17:30' }
];
export const SLOT_MINUTES = 60;

export interface StudentProfile {
  idNumber: string;
  fullName: string;
  course: string;
  courseCode: string;
  departmentCode: string;   // e.g. 'SACE'
  departmentName: string;
  departmentId: string;     // e.g. '0003'
  yearLevel: number;
  level: string;            // e.g. 'COLLEGE'
  enrollmentStatus: string;
  schoolYear: string;       // e.g. '2026271'
}

export interface Counselor {
  id: string;
  name: string;
  departmentCode: string;
}

export interface CounselingType {
  id: string;
  name: string;
}

// What a student sees for a slot: Available, Booked (another student), or Own appointment.
// NEVER expose another student's name or identifying information — only the status.
export interface CounselorScheduleSlot {
  scheduleDate: string;   // 'YYYY-MM-DD'
  startTime: string;      // 'HH:mm' (normalised from API value)
  endTime: string;        // 'HH:mm'
  isAvailable: boolean;
  status: string;         // raw status string from the API (e.g. 'Available', 'Booked')
}

export interface TimeSlot {
  startTime: string;   // 'HH:mm' (24h)
  endTime: string;
  label: string;       // '7:30 AM - 8:30 AM'
  status: SlotStatus;
}

export interface Appointment {
  id: number;
  studentId: string;
  counselorId: string;
  counselorName: string;
  counselingTypeId: string;
  counselingTypeName: string;  // AppointmentType: Student Initiated / Counselor Initiated / Walk-in / Referred
  concernTypeId: string;
  concernTypeName: string;     // ConcernType: Academic Concerns / Family Issues etc. — from API row
  date: string;        // 'YYYY-MM-DD'
  startTime: string;   // 'HH:mm'
  endTime: string;
  status: AppointmentStatus;
  schoolYear: string;
  notes: string;
  /** Follow-up appointments are distinct from normal appointments and must use follow-up APIs. */
  isFollowUp?: boolean;
  followUpId?: number;
  followUpReschedulePending?: boolean;
}

export interface BookingRequest {
  counselorId: string;
  counselingTypeId: string;  // appointmentTypeID — kept for backward compat, set to Student Initiated
  concernTypeId: string;     // concernTypeID — the concern the student selects
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
}

export interface RescheduleRequest {
  date: string;
  startTime: string;
  endTime: string;
}

// pageIndex is 0-based so it plugs straight into mat-paginator.
export interface HistoryQuery {
  pageIndex: number;
  pageSize: number;
  status: AppointmentStatus | 'All';
  search: string;
}

export interface HistoryResult {
  items: Appointment[];
  total: number;
}

// ---- Draft (Phase 1: in-memory; Phase 2 will back this with a backend endpoint) ----

export interface AppointmentDraft {
  /** Client-generated UUID, stable across edits. Phase 2: replace with server-assigned ID. */
  id: string;
  counselorId: string;
  counselorName: string;
  concernTypeId: string;
  concernTypeName: string;
  date: string;         // 'YYYY-MM-DD' — preferred date, may no longer be available
  startTime: string;    // 'HH:mm'
  endTime: string;
  notes: string;
  gradeOrYearLevel: number | null;  // from student profile; required by backend for submission
  savedAt: string;      // ISO timestamp
}
