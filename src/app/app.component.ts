import { bootstrapApplication } from '@angular/platform-browser';
import { Component, provideZoneChangeDetection, ViewChild } from '@angular/core';
import { DxDataGridModule, DxDataGridComponent } from 'devextreme-angular';
import { SelectionChangedEvent, CellClickEvent } from 'devextreme/ui/data_grid';
import { Service } from './app.service';
import ODataStore from 'devextreme/data/odata/store';
import { EdmLiteral } from 'devextreme/data/odata/utils';

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
  
  dataSource: any;
  selectedRecordCount: number = 0;
  totalCount: number = 0;
  selectAllHeader: { clicked: boolean; isSelectAll: boolean; } = { clicked: false, isSelectAll: false };
  selectedRecords: string[] = [];

  remoteOperations = {
    filtering: true,
    paging: true,
    sorting: true
  };

  // City filter data - initialize with common cities to avoid empty state
  cityFilterDataSource = [
    { text: 'Boise', value: 'Boise' },
    { text: 'Butte', value: 'Butte' },
    { text: 'Chelan', value: 'Chelan' },
    { text: 'Kent', value: 'Kent' },
    { text: 'Moscow', value: 'Moscow' },
    { text: 'Portland', value: 'Portland' },
    { text: 'San Francisco', value: 'San Francisco' },
    { text: 'Seattle', value: 'Seattle' }
  ];

  calculateCityFilter = (filterValue: any, selectedFilterOperation: string | null, target: string) => {
    // Return DevExtreme filter array format - will be transformed to OData any() in beforeSend
    return ['AddressInfo', 'contains', filterValue];
  };

  customizeCityText = (cellInfo: any) => {
    if (!cellInfo.value || !Array.isArray(cellInfo.value)) return '';
    return cellInfo.value
      .map((addr: any) => addr.City?.Name)
      .filter((name: any) => name)
      .join(', ');
  };

//   calculateCityFilter = (
//     filterValue: any,
//     selectedFilterOperation: string | null,
//     target: string,
//   ) => {
//     // if (target === "search" && typeof filterValue === "string") {
//     //      return [`AddressInfo/any(p: tolower(a/City/Name) eq '${filterValue}')`];
//     //   return ["FirstName", "contains", filterValue];
//     // }
    
//  return [[new EdmLiteral(`AddressInfo/any(a: tolower(a/City/Name) eq tolower('${filterValue}'))`), "=", true]];

// };


  constructor(service: Service) {
    // Using TripPin service with People entity
    const odataStore = new ODataStore({
      url: 'https://services.odata.org/V4/TripPinService/People',
      key: 'UserName',
      version: 4,
      beforeSend: (e) => {
        console.log('Original request params:', JSON.stringify(e.params, null, 2));
        
        // Transform AddressInfo filter to OData any() syntax
        if (e.params['$filter']) {
          let filter = e.params['$filter'];
          console.log('Original filter:', filter);
          
          filter = filter.replace(/contains\(tolower\(AddressInfo\),\s*'([^']+)'\)/gi, (match: string, value: string) => {
            return `AddressInfo/any(a: tolower(a/City/Name) eq '${value}')`;
          });
          
          e.params['$filter'] = filter;
          console.log('Transformed filter:', filter);
        }
      },
      errorHandler: (e) => {
        console.error('OData error:', e);
      }
    });

    this.dataSource = odataStore;
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
        this.selectedRecordCount = event.selectedRowKeys?.length || 0;
        this.selectedRecords = event.selectedRowKeys || [];
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
    provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true })
  ],
}).catch(err => console.error('Bootstrap error:', err));