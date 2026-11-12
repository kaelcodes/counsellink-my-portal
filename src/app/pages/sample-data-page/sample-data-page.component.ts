import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

interface SampleItem {
  itemName: string;
  status: string;
  quantity: number;
  date: Date;
  remarks: string;
}

@Component({
  selector: 'app-sample-data-page',
  templateUrl: './sample-data-page.component.html',
  styleUrls: ['./sample-data-page.component.scss']
})
export class SampleDataPageComponent implements OnInit {
  form!: FormGroup;
  items: SampleItem[] = [];
  filteredItems: SampleItem[] = [];
  currentPage: number = 1;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.form = this.fb.group({
      filterItemName: [''],
      filterStatus: ['']
    });

    this.loadSampleData();
    this.FilterList();
  }

  private loadSampleData() {
    this.items = [
      { itemName: 'Item 1', status: 'Active', quantity: 5, date: new Date('2026-10-01'), remarks: 'Sample remark 1' },
      { itemName: 'Item 2', status: 'Inactive', quantity: 3, date: new Date('2026-10-05'), remarks: 'Sample remark 2' },
      { itemName: 'Item 3', status: 'Active', quantity: 10, date: new Date('2026-10-10'), remarks: 'Sample remark 3' },
      { itemName: 'Item 4', status: 'Active', quantity: 7, date: new Date('2026-10-15'), remarks: 'Sample remark 4' },
      { itemName: 'Item 5', status: 'Inactive', quantity: 2, date: new Date('2026-10-20'), remarks: 'Sample remark 5' },
    ];
  }

  FilterList() {
    const itemNameFilter = (this.form.get('filterItemName') ? this.form.get('filterItemName')!.value : '').toString().toLowerCase().trim();
    const statusFilter = (this.form.get('filterStatus') ? this.form.get('filterStatus')!.value : '').toString().toLowerCase().trim();

    this.filteredItems = this.items.filter(item =>
      (!itemNameFilter || (item.itemName || '').toString().toLowerCase().includes(itemNameFilter)) &&
      (!statusFilter || (item.status || '').toString().toLowerCase() === statusFilter)
    );

    this.currentPage = 1;
  }

  clearFilter() {
    if (this.form) {
      this.form.reset({
        filterItemName: '',
        filterStatus: ''
      });
    }

    this.filteredItems = [...this.items];
    this.currentPage = 1;
  }
}
