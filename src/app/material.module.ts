import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';

import {MatStepperModule} from '@angular/material/stepper';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatListModule} from '@angular/material/list';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatMenuModule} from '@angular/material/menu';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTableModule} from '@angular/material/table';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule, MatTooltipModule} from '@angular/material';
import {MatRadioModule} from '@angular/material/radio';
import { MatPaginatorModule } from '@angular/material';
import {MatDialogModule} from '@angular/material';
import {MatChipsModule} from '@angular/material/chips';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatBadgeModule} from '@angular/material/badge';
import {MatButtonToggleModule} from '@angular/material/button-toggle';

@NgModule({
  imports: [MatButtonModule, MatToolbarModule,MatIconModule,MatCardModule,MatStepperModule,
  MatFormFieldModule,FormsModule, ReactiveFormsModule,MatInputModule,MatSelectModule,
  MatCheckboxModule,MatListModule,MatGridListModule,MatSidenavModule,MatExpansionModule,
  MatMenuModule,MatTabsModule,MatTableModule,MatDatepickerModule,MatNativeDateModule,
  MatRadioModule,MatPaginatorModule,MatDialogModule,MatChipsModule,MatProgressSpinnerModule,
  MatAutocompleteModule,MatProgressBarModule,DragDropModule,MatSnackBarModule,MatBadgeModule,
  MatTooltipModule,MatButtonToggleModule
  ],
  exports: [MatButtonModule, MatToolbarModule,MatIconModule,MatCardModule,MatStepperModule,
  MatFormFieldModule,FormsModule, ReactiveFormsModule,MatInputModule,MatSelectModule,
  MatCheckboxModule,MatListModule,MatGridListModule,MatSidenavModule,MatExpansionModule,
  MatMenuModule,MatTabsModule,MatTableModule,MatDatepickerModule,MatNativeDateModule,
  MatRadioModule,MatPaginatorModule,MatDialogModule,MatChipsModule,MatProgressSpinnerModule,
  MatAutocompleteModule,MatProgressBarModule,DragDropModule,MatSnackBarModule,MatBadgeModule,
  MatTooltipModule,MatButtonToggleModule
  ],
})
export class MaterialModule { }