import { bootstrapApplication } from '@angular/platform-browser';
import { Component, enableProdMode, provideZoneChangeDetection, ViewChild } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { DxDataGridModule, DxDataGridComponent } from 'devextreme-angular';
import { SelectionChangedEvent, CellClickEvent } from 'devextreme/ui/data_grid';
import { Employee, Service, FirstNameEnum, EmployeeAlias } from './app.service';
import ODataStore from 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';


let modulePrefix = '';
// @ts-ignore
if (window && window.config?.packageConfigPaths) {
  modulePrefix = '/app';
}

@Component({
  selector: 'demo-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  providers: [Service],
  imports: [
    DxDataGridModule,
  ],
})
export class AppComponent {
  @ViewChild('exposureGrid') exposureGrid?: DxDataGridComponent;
  
  employees: Employee[] = [];
  dataSource: any;
  selectedRecordCount: number = 0;
  totalCount: number = 0;
  selectAllHeader: { clicked: boolean; isSelectAll: boolean; } = { clicked: false, isSelectAll: false };
  selectedRecords: string[] = [];

  editorOptions = { placeholder: 'Search city' };

  searchExpr = ['City'];

  remoteOperations = {
    filtering: true,
    paging: true,
    sorting: true
  };

  firstNameFilterDataSource = [
    { text: 'Janet', value: 'Janet' },
    { text: 'Suzane', value: 'Suzane' },
    { text: 'Margaret', value: 'Margaret' },
    { text: 'Steven', value: 'Steven' },
    { text: 'Michael', value: 'Michael' },
    { text: 'Nan', value: 'Nan' }
  ];

  calculateFirstNameFilter = (filterValue: any, selectedFilterOperation: string | null, target: string) => {
    // Map fsname values back to OData FirstName for server-side filtering
    const fsnameToODataMap: { [key: string]: string[] } = {
      'Janet': ['Nancy', 'Andrew', 'Janet', 'Michael', 'Robert', 'Anne'],
      'Suzane': ['Nancy'],
      'Margaret': ['Andrew', 'Janet', 'Margaret', 'Michael', 'Laura'],
      'Steven': ['Andrew', 'Margaret', 'Steven', 'Robert', 'Laura'],
      'Michael': ['Janet', 'Steven', 'Michael', 'Anne'],
      'Nan': ['Margaret', 'Steven', 'Michael', 'Anne']
    };
    
    const odataValues = fsnameToODataMap[filterValue] || [];
    
    if (odataValues.length === 0) {
      return ['FirstName', '=', filterValue];
    } else if (odataValues.length === 1) {
      return ['FirstName', '=', odataValues[0]];
    } else {
      // Build OR expression for OData
      const filters = odataValues.map(value => ['FirstName', '=', value]);
      return filters.reduce((acc: any, filter, index) => {
        if (index === 0) return filter;
        return [acc, 'or', filter];
      });
    }
  };

  getFirstName = (rowData: any) => {
    // Display transformed FirstName array as comma-separated fsname values
    if (rowData.FirstName && Array.isArray(rowData.FirstName) && rowData.FirstName.length > 0) {
      return rowData.FirstName.map((p: EmployeeAlias) => p.fsname).join(', ');
    }
    return '';
  };

  constructor(service: Service) {
    console.log('Component initialized, setting up OData store...');
    
    // Create OData store for remote operations
    const odataStore = new ODataStore({
      url: 'https://services.odata.org/V4/Northwind/Northwind.svc/Employees',
      key: 'EmployeeID',
      keyType: 'Int32',
      version: 4,
      deserializeDates: false,
      beforeSend: (e) => {
        console.log('OData request params:', e.params);
        
        // Add ascending sort order if not specified
        if (e.params['$orderby'] && !e.params['$orderby'].endsWith(' desc')) {
          e.params['$orderby'] += ' asc';
        }
        
        // Transform FirstName filters to work with OData
        if (e.params['$filter'] && e.params['$filter'].includes('FirstName')) {
          // OData Northwind has FirstName as a simple string field
          // Keep the filter as-is since we'll display transformed data on client side
          console.log('Filter applied:', e.params['$filter']);
        }
      },
      errorHandler: (e) => {
        console.error('OData error:', e);
      }
    });

    // Wrap with DataSource to transform the response
    this.dataSource = new DataSource({
      store: odataStore,
      postProcess: (data: any[]) => {
        // Transform each item
        return data.map((item: any) => {
          const firstName = item.FirstName;
          let firstNameArray: EmployeeAlias[] = [];
          
          const createAlias = (fsname: string, name: string): EmployeeAlias => ({
            fsname: fsname,
            name: name,
            nickname: name.substring(0, 4).toLowerCase()
          });
          
          if (firstName === 'Nancy') {
            firstNameArray = [
              createAlias('Janet', 'Janet'),
              createAlias('Suzane', 'Suzane')
            ];
          } else if (firstName === 'Andrew') {
            firstNameArray = [
              createAlias('Janet', 'Janet'),
              createAlias('Margaret', 'Margaret'),
              createAlias('Steven', 'Steven')
            ];
          } else if (firstName === 'Janet') {
            firstNameArray = [
              createAlias('Margaret', 'Margaret'),
              createAlias('Michael', 'Michael')
            ];
          } else if (firstName === 'Margaret') {
            firstNameArray = [
              createAlias('Steven', 'Steven'),
              createAlias('Michael', 'Michael'),
              createAlias('Nan', 'Nancy')
            ];
          } else if (firstName === 'Steven') {
            firstNameArray = [
              createAlias('Michael', 'Michael'),
              createAlias('Nan', 'Nancy')
            ];
          } else if (firstName === 'Michael') {
            firstNameArray = [
              createAlias('Nan', 'Nancy'),
              createAlias('Janet', 'Janet'),
              createAlias('Margaret', 'Margaret')
            ];
          } else if (firstName === 'Robert') {
            firstNameArray = [
              createAlias('Steven', 'Steven'),
              createAlias('Janet', 'Janet')
            ];
          } else if (firstName === 'Laura') {
            firstNameArray = [
              createAlias('Margaret', 'Margaret'),
              createAlias('Steven', 'Steven')
            ];
          } else if (firstName === 'Anne') {
            firstNameArray = [
              createAlias('Michael', 'Michael'),
              createAlias('Nan', 'Nancy'),
              createAlias('Janet', 'Janet')
            ];
          } else {
            firstNameArray = [createAlias(firstName, firstName)];
          }
          
          return {
            ...item,
            FirstName: firstNameArray,
            _originalFirstName: firstName // Keep original for debugging
          };
        });
      }
    });
  }

  onSelectionChanged(event: SelectionChangedEvent) {
    const selectionFilter = this.exposureGrid?.instance?.option('selectionFilter');
    
    if (this.selectAllHeader && this.selectAllHeader.clicked) {
      this.selectedRecordCount = this.selectAllHeader.isSelectAll ? this.totalCount : 0;
      this.selectedRecords = [];
      console.log('Select all clicked:', {
        isSelectAll: this.selectAllHeader.isSelectAll,
        selectedCount: this.selectedRecordCount,
        totalCount: this.totalCount
      });
      this.selectAllHeader.clicked = false;
      return;
    }
    
    if (selectionFilter === null) {
      this.selectedRecordCount = 0;
      this.selectedRecords = [];
    } else if (Array.isArray(selectionFilter)) {
      // Handle negation patterns (select all except...)
      if (this.hasNegationPattern(selectionFilter)) {
        const negatedCount = this.countNegations(selectionFilter);
        this.selectedRecordCount = this.totalCount - negatedCount;
        this.selectedRecords = [];
      } else {
        // Regular selection
        this.selectedRecordCount = event.selectedRowKeys.length;
        this.selectedRecords = event.selectedRowKeys;
      }
    }
    
    console.log('Selection changed:', {
      selectedCount: this.selectedRecordCount,
      totalCount: this.totalCount,
      selectionFilter: selectionFilter,
      selectedRowKeys: event.selectedRowKeys
    });
  }

  onCellClick(event: CellClickEvent) {
    if (event.columnIndex === 0 && event.cellElement.classList.contains('dx-command-select')) {
      this.selectAllHeader = {
        clicked: false,
        isSelectAll: false
      };
      
      if (event.rowType === 'header') {
        const immediateChildDiv = event.cellElement.querySelector(':scope > div.dx-checkbox-checked');
        const isSelectAll = immediateChildDiv !== null;
        this.selectAllHeader = {
          clicked: true,
          isSelectAll: isSelectAll
        };
        console.log('Header checkbox clicked:', { isSelectAll });
      }
    }
  }

  private hasNegationPattern(selectionFilter: unknown[]): boolean {
    return selectionFilter.some(item => 
      Array.isArray(item) && 
      item.length === 2 && 
      item[0] === '!' && 
      Array.isArray(item[1])
    );
  }

  private countNegations(selectionFilter: unknown[]): number {
    let count = 0;
    for (const item of selectionFilter) {
      if (Array.isArray(item) && item.length === 2 && item[0] === '!' && Array.isArray(item[1])) {
        count++;
      }
    }
    return count;
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true }),
    provideHttpClient(), // Add HttpClient provider
  ],
}).catch(err => console.error('Bootstrap error:', err));