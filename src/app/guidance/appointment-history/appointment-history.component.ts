import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { GuidanceService } from '../guidance.service';
import { Appointment, APPOINTMENT_STATUSES, AppointmentStatus } from '../guidance.models';

@Component({
  selector: 'app-appointment-history',
  templateUrl: './appointment-history.component.html',
  styleUrls: ['./appointment-history.component.scss']
})
export class AppointmentHistoryComponent implements OnInit, OnDestroy {
  readonly statuses = APPOINTMENT_STATUSES;
  readonly pageSizes = [5, 10, 25];

  items: Appointment[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 5;
  status: AppointmentStatus | 'All' = 'All';
  search = '';

  loading = true;
  error = '';

  private typing$ = new Subject<void>();
  private sub: Subscription;
  private requestNo = 0;

  constructor(private guidance: GuidanceService) { }

  ngOnInit() {
    this.sub = this.typing$.pipe(debounceTime(300)).subscribe(() => {
      this.pageIndex = 0;
      this.load();
    });
    this.load();
  }

  ngOnDestroy() {
    if (this.sub) { this.sub.unsubscribe(); }
  }

  load() {
    const no = ++this.requestNo;
    this.loading = true;
    this.error = '';
    this.guidance.getHistory({
      pageIndex: this.pageIndex, pageSize: this.pageSize, status: this.status, search: this.search
    }).subscribe(
      r => {
        if (no !== this.requestNo) { return; }
        this.items = r.items;
        this.total = r.total;
        this.loading = false;
      },
      e => {
        if (no !== this.requestNo) { return; }
        this.error = (e && e.message) ? e.message : 'Could not load your appointment history.';
        this.loading = false;
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
}
