import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { SportApiService } from '../sport-api.service';

@Component({
  selector: 'app-sport-borrowed-items',
  templateUrl: './sport-borrowed-items.component.html',
  styleUrls: ['./sport-borrowed-items.component.scss']
})
export class SportBorrowedItemsComponent implements OnInit {
  filteredRows: any[] = [];
  classificationsPage: number = 1;
  isLoading = false;
  loadError = '';

  constructor(public dialogRef: MatDialogRef<SportBorrowedItemsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sportApiService: SportApiService
  ) { }

  ngOnInit() {
    this.loadBorrowRequestItems();
  }

  loadBorrowRequestItems() {
    this.isLoading = true;
    this.loadError = '';

    this.sportApiService.getBorrowRequestItems().subscribe(res => {
      const items = this.normalizeBorrowRequestItems(res);
      const borrowRequestId = this.getBorrowRequestId();
      const fallbackItems = this.data && Array.isArray(this.data.borrowedItems) ? this.data.borrowedItems : [];

      if (borrowRequestId) {
        this.filteredRows = items.filter(item => this.matchesBorrowRequestId(item, borrowRequestId));
      } else if (fallbackItems.length > 0) {
        this.filteredRows = fallbackItems;
      } else {
        this.filteredRows = items;
      }

      if ((!this.filteredRows || this.filteredRows.length === 0) && fallbackItems.length > 0) {
        this.filteredRows = fallbackItems;
      }

      this.isLoading = false;
    }, error => {
      console.error('Error loading borrow request items:', error);
      this.loadError = 'Unable to load borrow request items.';
      this.filteredRows = this.data && this.data.borrowedItems ? this.data.borrowedItems : [];
      this.isLoading = false;
    });
  }

  private normalizeBorrowRequestItems(res: any): any[] {
    if (Array.isArray(res)) {
      return res;
    }

    if (res && Array.isArray(res.data)) {
      return res.data;
    }

    return [];
  }

  private getBorrowRequestId(): string {
    const data = this.data || {};
    const requestId = data.borrowRequestId || data.requestId || data.requestID || data.id || '';
    return requestId ? requestId.toString().trim() : '';
  }

  private matchesBorrowRequestId(item: any, borrowRequestId: string): boolean {
    const itemBorrowRequestId =
      item.borrowRequestId ||
      item.BorrowRequestId ||
      item.borrowRequestID ||
      item.BorrowRequestID ||
      item.requestId ||
      item.RequestId ||
      item.requestID ||
      item.RequestID ||
      '';

    return itemBorrowRequestId ? itemBorrowRequestId.toString().trim() === borrowRequestId : false;
  }

  getItemName(row: any): string {
    return this.getFieldValue(row, [
      'ItemName',
      'itemName',
      'EquipmentName',
      'equipmentName',
      'name',
      'borrowItemName',
      'BorrowItemName'
    ]) || 'Unknown Item';
  }

  getQuantityRequested(row: any): any {
    return this.getFieldValue(row, [
      'QuantityRequested',
      'quantityRequested',
      'requestedQuantity',
      'qtyRequested',
      'quantity',
      'Quantity',
      'borrowQuantity',
      'BorrowQuantity'
    ]) || 0;
  }

  getQuantityApproved(row: any): any {
    return this.getFieldValue(row, [
      'QuantityApproved',
      'quantityApproved',
      'approvedQuantity',
      'qtyApproved',
      'ApprovedQuantity',
      'quantity'
    ]) || 0;
  }

  getQuantityReturned(row: any): any {
    return this.getFieldValue(row, [
      'QuantityReturned',
      'quantityReturned',
      'returnedQuantity',
      'qtyReturned',
      'ReturnedQuantity'
    ]);
  }

  getBorrowRequestItemStatus(row: any): string {
    return this.getFieldValue(row, [
      'BorrowRequestItemStatus',
      'borrowRequestItemStatus',
      'ItemReturnStatus',
      'itemReturnStatus',
      'returnStatus',
      'ReturnStatus',
      'status',
      'Status'
    ]) || '';
  }

  getDateReturned(row: any): string {
    const rawDate = this.getFieldValue(row, [
      'returnDate',
      'ReturnDate',
      'DateReturned',
      'dateReturned',
      'ReturnedDate',
      'returnedDate',
    ]);

    if (!rawDate) {
      return '';
    }

    const parsed = new Date(rawDate);
    return isNaN(parsed.getTime()) ? rawDate : parsed.toLocaleDateString();
  }

  getReturnedCondition(row: any): string {
    return this.getFieldValue(row, [
      'returnCondition',
      'ReturnCondition',
      'ReturnedCondition',
      'returnedCondition',
      'condition',
      'Condition'
    ]) || '';
  }

  getReceivedBy(row: any): string {
    return this.getFieldValue(row, [
      'receivedBy',
      'ReceivedBy',
      'receivedby',
      'receiver',
      'Receiver'
    ]) || '';
  }

  getRemarks(row: any): string {
    return this.getFieldValue(row, [
      'Remarks',
      'remarks',
      'note',
      'Note',
      'notes',
      'Notes'
    ]) || '';
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

  private normalizeFieldName(value: string): string {
    return (value || '').toString().toLowerCase().replace(/[_\s]/g, '');
  }

  onClose() {
    this.dialogRef.close({ message: "Closed", data: null });

  }
}
