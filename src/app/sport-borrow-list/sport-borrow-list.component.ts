import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Http } from '@angular/http';
import { GlobalService } from '../global.service';
import { SportApiService } from './sport-api.service';
import 'rxjs/add/operator/map';
import { MatDialog } from '@angular/material';
import { SportBorrowedItemsComponent } from './sport-borrowed-items/sport-borrowed-items.component';

@Component({
  selector: 'app-sport-borrow-list',
  templateUrl: './sport-borrow-list.component.html',
  styleUrls: ['./sport-borrow-list.component.scss']
})
export class SportBorrowListComponent implements OnInit {
  form!: FormGroup;
  filteredRows: any[] = [];
  classificationsPage: number = 1;
  expandedRemarks: { [key: string]: boolean } = {};
  private allRows: any[] = [];
  private borrowRequests: any[] = [];
  private borrowRequestItems: any[] = [];
  private borrowerName = '';
  private borrowerId = '';
  filterRequestStartDate: Date | null = null;
  filterRequestEndDate: Date | null = null;
  filterExpectedStartDate: Date | null = null;
  filterExpectedEndDate: Date | null = null;
  filterActualStartDate: Date | null = null;
  filterActualEndDate: Date | null = null;

  constructor(
    private http: Http,
    public global: GlobalService,
    private fb: FormBuilder,
    private sportApiService: SportApiService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      filterRequestStartDate: [null],
      filterRequestEndDate: [null],
      filterExpectedStartDate: [null],
      filterExpectedEndDate: [null],
      filterActualStartDate: [null],
      filterActualEndDate: [null],
      filterApprovedBy: [''],
      filterRemarks: [''],
      filterStatus: ['']
    });
    this.loadBorrowRequestsForUser();

    console.log("sy", this.global.schoolyear);

  }

  onSubmit() {
  }

  FilterList() {
    const requestStartDate = this.getFilterDate('filterRequestStartDate');
    const requestEndDate = this.getFilterDate('filterRequestEndDate');
    const expectedStartDate = this.getFilterDate('filterExpectedStartDate');
    const expectedEndDate = this.getFilterDate('filterExpectedEndDate');
    const actualStartDate = this.getFilterDate('filterActualStartDate');
    const actualEndDate = this.getFilterDate('filterActualEndDate');
    const approvedByControl = this.form.get('filterApprovedBy');
    const remarksControl = this.form.get('filterRemarks');
    const statusControl = this.form.get('filterStatus');

    const filterApprovedBy = (approvedByControl && approvedByControl.value || '').toLowerCase().trim();
    const filterRemarks = (remarksControl && remarksControl.value || '').toLowerCase().trim();
    const filterStatus = (statusControl && statusControl.value || '').toLowerCase().trim();

    this.filteredRows = (this.allRows || []).filter(row => {
      const requestDate = this.getBorrowRequestDate(row);
      const expectedReturnDate = this.getExpectedReturnDate(row);
      const actualReturnDate = this.getActualReturnDate(row);
      const approvedByName = this.getApprovedByName(row);

      if (requestEndDate && !this.isDateWithinRange(requestDate, requestStartDate, requestEndDate)) {
        return false;
      }

      if (expectedEndDate && !this.isDateWithinRange(expectedReturnDate, expectedStartDate, expectedEndDate)) {
        return false;
      }

      if (actualEndDate && !this.isDateWithinRange(actualReturnDate, actualStartDate, actualEndDate)) {
        return false;
      }

      if (filterApprovedBy && !this.matchesNameFilter(approvedByName, filterApprovedBy)) {
        return false;
      }

      if (filterRemarks && !(row.remarks || row.Remarks || '').toString().toLowerCase().includes(filterRemarks)) {
        return false;
      }

      if (filterStatus && !(row.borrowRequestStatus || row.BorrowRequestStatus || row.BorrowRequestStatusID || '').toString().toLowerCase().includes(filterStatus)) {
        return false;
      }

      return true;
    });

    this.classificationsPage = 1;
  }

  filterRequests() {
    this.FilterList();
  }

  clearFilter() {
    this.form.reset({
      filterRequestStartDate: null,
      filterRequestEndDate: null,
      filterExpectedStartDate: null,
      filterExpectedEndDate: null,
      filterActualStartDate: null,
      filterActualEndDate: null,
      filterApprovedBy: '',
      filterRemarks: '',
      filterStatus: ''
    });
    this.filterRequestStartDate = null;
    this.filterRequestEndDate = null;
    this.filterExpectedStartDate = null;
    this.filterExpectedEndDate = null;
    this.filterActualStartDate = null;
    this.filterActualEndDate = null;
    this.FilterList();
    this.classificationsPage = 1;
  }

  isDateWithinRange(checkDate: Date | null, dateFrom: Date | null, dateTo: Date | null): boolean {
    if (!checkDate) {
      return false;
    }

    const candidate = new Date(checkDate);
    candidate.setHours(0, 0, 0, 0);

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (candidate < from) {
        return false;
      }
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (candidate > to) {
        return false;
      }
    }

    return true;
  }

  filterOnlyPreviousDates = (d: Date | null): boolean => {
    const endDate = this.getFilterDate('filterRequestEndDate');
    if (!endDate) {
      return true;
    }

    const date = d || new Date();
    const filterEndDate = new Date(endDate);

    date.setHours(0, 0, 0, 0);
    filterEndDate.setHours(0, 0, 0, 0);

    return date <= filterEndDate;
  };

  filterOnlyFutureDates = (d: Date | null): boolean => {
    const startDate = this.getFilterDate('filterRequestStartDate');
    if (!startDate) {
      return true;
    }

    const date = d || new Date();
    const filterStartDate = new Date(startDate);

    date.setHours(0, 0, 0, 0);
    filterStartDate.setHours(0, 0, 0, 0);

    return date >= filterStartDate;
  };

  filterOnlyPreviousDatesExpected = (d: Date | null): boolean => {
    const endDate = this.getFilterDate('filterExpectedEndDate');
    if (!endDate) {
      return true;
    }

    const date = d || new Date();
    const filterEndDate = new Date(endDate);

    date.setHours(0, 0, 0, 0);
    filterEndDate.setHours(0, 0, 0, 0);

    return date <= filterEndDate;
  };

  filterOnlyFutureDatesExpected = (d: Date | null): boolean => {
    const startDate = this.getFilterDate('filterExpectedStartDate');
    if (!startDate) {
      return true;
    }

    const date = d || new Date();
    const filterStartDate = new Date(startDate);

    date.setHours(0, 0, 0, 0);
    filterStartDate.setHours(0, 0, 0, 0);

    return date >= filterStartDate;
  };

  filterOnlyPreviousDatesActual = (d: Date | null): boolean => {
    const endDate = this.getFilterDate('filterActualEndDate');
    if (!endDate) {
      return true;
    }

    const date = d || new Date();
    const filterEndDate = new Date(endDate);

    date.setHours(0, 0, 0, 0);
    filterEndDate.setHours(0, 0, 0, 0);

    return date <= filterEndDate;
  };

  filterOnlyFutureDatesActual = (d: Date | null): boolean => {
    const startDate = this.getFilterDate('filterActualStartDate');
    if (!startDate) {
      return true;
    }

    const date = d || new Date();
    const filterStartDate = new Date(startDate);

    date.setHours(0, 0, 0, 0);
    filterStartDate.setHours(0, 0, 0, 0);

    return date >= filterStartDate;
  };

  private getFilterDate(controlName: string): Date | null {
    const value = this.form && this.form.get(controlName) ? this.form.get(controlName).value : null;
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  openBorrowRequestDialog(row: any) {
  }

  openEditDialog(row: any) {
  }

  removeRow(row: any) {
  }

  getItemNames(items: any[]): string {
    if (!items || items.length === 0) {
      return 'No items';
    }

    const itemNames = items.map(item => {
      const name = item.ItemName || item.itemName || item.equipmentName || item.name || 'Unknown Item';
      const quantity = item.Quantity || item.quantity || 1;
      return quantity > 1 ? `${name} (${quantity})` : name;
    });

    return itemNames.join(', ');
  }

  toggleRemarks(key: string): void {
    this.expandedRemarks[key] = !this.expandedRemarks[key];
  }

  isRemarksExpanded(key: string): boolean {
    return !!this.expandedRemarks[key];
  }

  getRemarksIcon(key: string): string {
    return this.isRemarksExpanded(key) ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  }

  getRemarksDisplay(row: any, key: string): string {
    const text = this.getRemarksText(row);
    if (!text) {
      return '-';
    }

    return this.isRemarksExpanded(key) ? text : '...';
  }

  private loadBorrowRequestsForUser() {
    if (!this.global.option && this.global.getSession()) {
      this.global.requestToken(this.global.getSession());
    }

    this.ensureBorrowerInfo(() => {
      this.borrowerId = this.getLoggedInUserId();
      this.borrowerName = this.getLoggedInBorrowerName();

      console.log('Logged In User ID:', this.borrowerId);
      console.log('Logged In User Name:', this.borrowerName);

      // Use service to get and filter borrow requests by logged-in user's ID and full name
      this.sportApiService.getBorrowRequestsForLoggedInUser(this.borrowerId, this.borrowerName)
        .subscribe(filtered => {
          console.log('Filtered Results:', filtered);
          this.borrowRequests = filtered || [];
          // Load items for all requests
          this.loadBorrowRequestItems(this.borrowRequests);
        }, Error => {
          console.error('API Error:', Error);
          this.global.swalAlertError(Error);
          this.global.borrowRequestCount = 0;
        });
    });
  }

  private loadBorrowRequestItems(filtered: any[]) {
    this.sportApiService.getBorrowRequestItems()
      .subscribe(res => {
        this.borrowRequestItems = res.data || res || [];
        this.allRows = this.buildBorrowRequestRows(filtered);
        this.FilterList();
      }, Error => {
        console.error('Error loading borrow request items:', Error);
        this.global.swalAlertError(Error);
        this.allRows = filtered;
        this.FilterList();
      });
  }

  private buildBorrowRequestRows(filtered: any[]): any[] {
    const requestMap: { [key: string]: any } = {};
    filtered.forEach(req => {
      const key = this.getBorrowRequestKey(req);
      if (key) {
        requestMap[key] = req;
      }
    });

    const filteredItems = this.borrowRequestItems.filter(item => {
      const itemRequestId = this.getBorrowRequestId(item);
      return itemRequestId && requestMap[itemRequestId.toString()];
    });

    return filtered.map(req => {
      const requestId = this.getBorrowRequestKey(req);
      const items = filteredItems.filter(item => {
        const itemRequestId = this.getBorrowRequestId(item);
        return itemRequestId !== null && requestId !== null && itemRequestId.toString() === requestId;
      });

      return {
        ...req,
        itemCount: items.length,
        items: items,
        actualReturnDate: this.getActualReturnDate(req)
      };
    });
  }

  openDetails(row: any) {
    const dialogRef = this.dialog.open(SportBorrowedItemsComponent, {
      width: '1150px',
      data: {
        borrowRequestId: this.getBorrowRequestKey(row),
        borrowedItems: row.items || []
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.message === 'Close') {

      }
    });
  }

  private ensureBorrowerInfo(done: () => void) {
    if (this.global.userinfo || this.global.empPInfo || this.global.empInfo) {
      done();
      return;
    }

    if (this.global.requestrole && this.global.requestrole() === 'Employee') {
      this.http.get(this.global.api + 'EmployeePortal/PersonalInfo/' + this.global.requestid(), this.global.option)
        .map(response => response.json())
        .subscribe(res => {
          this.global.empPInfo = res.data;
          done();
        }, Error => {
          this.global.swalAlertError(Error);
        });
      return;
    }

    this.global.apiPersonInfo().subscribe(res => {
      this.global.userinfo = res.data;
      done();
    }, Error => {
      this.global.swalAlertError(Error);
    });
  }

  private filterBorrowRequestsByUser(requests: any[], borrowerId: string, borrowerName: string): any[] {
    if (!borrowerId && !borrowerName) {
      return requests;
    }

    const idTarget = (borrowerId || '').toString().trim();
    const nameTarget = this.normalizeName(borrowerName);
    const nameTargetNoComma = nameTarget.replace(/,/g, '');
    return requests.filter(req => {
      if (idTarget) {
        const reqId = this.getBorrowRequestUserId(req);
        if (reqId && reqId === idTarget) {
          return true;
        }
      }

      if (!nameTarget) {
        return false;
      }

      const borrower = this.normalizeName(req.borrower || req.borrowerName || req.borrowerFullName || '');
      if (borrower === nameTarget) {
        return true;
      }
      return borrower.replace(/,/g, '') === nameTargetNoComma;
    });
  }

  private getLoggedInUserId(): string {
    const info = this.global.userinfo || this.global.empPInfo || this.global.empInfo;
    if (info) {
      // Prioritize idnumber field
      const idNumber = info.idNumber || info.idnumber;
      if (idNumber) {
        return idNumber.toString().trim();
      }
    }

    // Fallback to other ID fields
    const id = this.global.requestid ? this.global.requestid() : '';
    if (id) {
      return id.toString();
    }

    const altId = (info && (info.employeeId || info.employeeID)) || '';
    return altId ? altId.toString() : '';
  }

  private getLoggedInBorrowerName(): string {
    const info = this.global.userinfo || this.global.empPInfo || this.global.empInfo;
    if (!info) {
      return '';
    }

    const lastName = info.lastName || info.lastname || '';
    const firstName = info.firstName || info.firstname || '';
    const middleName = info.middleName || info.middlename || '';
    const suffixName = info.suffixName || info.suffix || '';

    let name = '';
    if (lastName && firstName) {
      name = `${lastName}, ${firstName}`;
    } else {
      name = `${firstName} ${lastName}`.trim();
    }

    if (middleName) {
      name = `${name} ${middleName}`;
    }
    if (suffixName) {
      name = `${name} ${suffixName}`;
    }

    return name.trim();
  }

  private normalizeName(value: string): string {
    return (value || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private normalizeFieldName(value: string): string {
    return (value || '').toString().toLowerCase().replace(/[_\s]/g, '');
  }

  private isReturnedRequest(req: any): boolean {
    if (!req) {
      return false;
    }

    const statusText = (req.borrowRequestStatus || req.BorrowRequestStatus || req.status || req.Status || '').toString().toLowerCase().trim();
    if (statusText.includes('returned')) {
      return true;
    }

    const statusId = req.borrowRequestStatusID || req.BorrowRequestStatusID || req.statusID || req.statusId;
    if (typeof statusId === 'number' && statusId === 7) {
      return true;
    }
    if (typeof statusId === 'string' && statusId.toLowerCase() === 'returned') {
      return true;
    }

    return false;
  }

  private isRejectedRequest(req: any): boolean {
    if (!req) {
      return false;
    }

    const statusText = (req.borrowRequestStatus || req.BorrowRequestStatus || req.status || req.Status || '').toString().toLowerCase().trim();
    if (statusText.includes('reject')) {
      return true;
    }

    const statusId = req.borrowRequestStatusID || req.BorrowRequestStatusID || req.statusID || req.statusId;
    if (typeof statusId === 'string' && statusId.toLowerCase().includes('reject')) {
      return true;
    }

    return false;
  }

  getApprovalDate(row: any): Date | null {
    if (!row) {
      return null;
    }

    const rawDate = this.getFieldValue(row, [
      'approvalDate',
      'ApprovalDate',
      'approvedDate',
      'ApprovedDate',
      'approval_date',
      'approved_date',
      'approvedOn',
      'ApprovedOn',
      'approvedAt',
      'ApprovedAt',
      'dateApproved',
      'DateApproved',
      'approval',
      'Approval'
    ]) || this.findApprovalDateLikeValue(row);

    if (!rawDate) {
      return null;
    }

    const parsed = new Date(rawDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  getApprovalDateForDisplay(row: any): Date | null {
    if (!row) {
      return null;
    }

    if (this.isRejectedRequest(row)) {
      return this.getRejectedDate(row) || this.getApprovalDate(row);
    }

    if (this.isReturnedRequest(row)) {
      return this.getActualReturnDate(row) || this.getApprovalDate(row);
    }

    return this.getApprovalDate(row);
  }

  getApprovedByDisplay(row: any): string {
    if (!row) {
      return '---';
    }

    const approvedBy = this.getApprovedByName(row);
    if (approvedBy && !this.isReturnedRequest(row)) {
      return approvedBy.toString();
    }

    if (this.isReturnedRequest(row)) {
      const approvalDate = this.getApprovalDate(row);
      if (approvalDate) {
        return approvalDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
      }
    }

    return approvedBy ? approvedBy.toString() : '---';
  }

  private getApprovedByName(row: any): string {
    if (!row) {
      return '';
    }

    const approvedBy =
      row.approvedByName ||
      row.approvedBy ||
      row.ApprovedBy ||
      row.approvedByFullName ||
      row.ApprovedByFullName ||
      '';

    return approvedBy ? approvedBy.toString().trim() : '';
  }

  private getRemarksText(row: any): string {
    if (!row) {
      return '';
    }

    return (row.remarks || row.Remarks || '').toString().trim();
  }

  private matchesNameFilter(value: string, filter: string): boolean {
    const normalizedValue = this.normalizeName(value);
    const normalizedFilter = this.normalizeName(filter);

    if (!normalizedFilter) {
      return true;
    }

    if (!normalizedValue) {
      return false;
    }

    return normalizedValue.includes(normalizedFilter) ||
      normalizedValue.replace(/,/g, '').includes(normalizedFilter.replace(/,/g, ''));
  }

  private getBorrowRequestUserId(value: any): string {
    if (!value) {
      return '';
    }
    const id = value.borrowerId ||
      value.borrowerID ||
      value.borrowerIdNumber ||
      value.borrowerIDNumber ||
      value.idNumber ||
      value.idnumber ||
      value.requesterId ||
      value.requesterID ||
      value.userId ||
      value.userID ||
      '';
    return id ? id.toString() : '';
  }

  private getFieldValue(row: any, fieldNames: string[]): any {
    if (!row || !fieldNames || fieldNames.length === 0) {
      return null;
    }

    const normalizedFieldNames = fieldNames.map(name => this.normalizeFieldName(name));
    const keys = Object.keys(row);

    for (const key of keys) {
      if (normalizedFieldNames.includes(this.normalizeFieldName(key))) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }
    }

    return null;
  }

  private findApprovalDateLikeValue(row: any): any {
    if (!row) {
      return null;
    }

    const keys = Object.keys(row);
    for (const key of keys) {
      const normalizedKey = this.normalizeFieldName(key);
      const looksLikeApprovalDate =
        (normalizedKey.includes('approve') || normalizedKey.includes('approval')) &&
        (normalizedKey.includes('date') || normalizedKey.includes('on') || normalizedKey.includes('at'));

      if (looksLikeApprovalDate) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }
    }

    return null;
  }

  private buildItemCountByRequestId(items: any[]): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    items.forEach(item => {
      const id = this.getBorrowRequestId(item);
      if (id === null || id === undefined) {
        return;
      }
      const key = id.toString();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  private getItemCount(itemsByRequestId: { [key: string]: number }, req: any): number {
    const key = this.getBorrowRequestKey(req);
    if (!key) {
      return 0;
    }
    return itemsByRequestId[key] || 0;
  }

  private getBorrowRequestKey(value: any): string | null {
    const id = this.getBorrowRequestId(value);
    if (id === null || id === undefined) {
      return null;
    }
    return id.toString();
  }

  private getBorrowRequestId(value: any): string | number | null {
    if (!value) {
      return null;
    }
    return value.borrowRequestId ||
      value.borrowRequestID ||
      value.requestId ||
      value.requestID ||
      value.id ||
      null;
  }

  private getBorrowRequestDate(row: any): Date | null {
    if (!row) {
      return null;
    }

    const rawDate =
      row.requestDate ||
      row.RequestDate ||
      row.borrowRequestDate ||
      row.BorrowRequestDate ||
      row.createdAt ||
      row.CreatedAt ||
      null;

    if (!rawDate) {
      return null;
    }

    const parsed = new Date(rawDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private getExpectedReturnDate(row: any): Date | null {
    if (!row) {
      return null;
    }

    const rawDate =
      row.expectedReturnDate ||
      row.ExpectedReturnDate ||
      null;

    if (!rawDate) {
      return null;
    }

    const parsed = new Date(rawDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private getActualReturnDate(row: any): Date | null {
    if (!row) {
      return null;
    }

    const rawDate = this.getFieldValue(row, [
      'actualReturnDate',
      'ActualReturnDate',
      'returnedDate',
      'ReturnedDate',
      'returnDate',
      'ReturnDate',
      'returnedOn',
      'ReturnedOn',
      'returnedAt',
      'ReturnedAt',
      'dateReturned',
      'DateReturned'
    ]) || (
        row.actualReturnDate ||
        row.ActualReturnDate ||
        row.returnedDate ||
        row.ReturnedDate ||
        null
      );

    if (!rawDate) {
      return null;
    }

    const parsed = new Date(rawDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private getRejectedDate(row: any): Date | null {
    if (!row) {
      return null;
    }

    const rawDate = this.getFieldValue(row, [
      'rejectDate',
      'RejectedDate',
      'rejectedDate',
      'reject_date',
      'rejected_date',
      'rejectedOn',
      'RejectedOn',
      'rejectedAt',
      'RejectedAt',
      'dateRejected',
      'DateRejected',
      'rejectOn',
      'RejectOn',
      'rejectAt',
      'RejectAt'
    ]) || (
        row.rejectDate ||
        row.RejectedDate ||
        row.rejectedDate ||
        row.reject_date ||
        row.rejected_date ||
        row.rejectedOn ||
        row.RejectedOn ||
        row.rejectedAt ||
        row.RejectedAt ||
        null
      );

    if (!rawDate) {
      return null;
    }

    const parsed = new Date(rawDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }



}
