import { bootstrapApplication } from '@angular/platform-browser';
import { Component, enableProdMode, provideZoneChangeDetection, ViewChild } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { DxDataGridModule, DxDataGridComponent } from 'devextreme-angular';
import { SelectionChangedEvent, CellClickEvent } from 'devextreme/ui/data_grid';
import { Employee, Service, FirstNameEnum, Provider } from './app.service';
import CustomStore from 'devextreme/data/custom_store';


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

  firstNameFilterDataSource = [
    { text: 'Nan', value: 'Nan' },
    { text: 'Janet', value: 'Janet' },
    { text: 'Margaret', value: 'Margaret' },
    { text: 'Steven', value: 'Steven' },
    { text: 'Michael', value: 'Michael' }
  ];

  calculateFirstNameFilter = (filterValue: any, selectedFilterOperation: string | null, target: string) => {
    // Return a filter expression array that will be sent to the server/CustomStore
    return ['FirstName', '=', filterValue];
  };

  getFirstName = (rowData: Employee) => {
    if (rowData.FirstName && rowData.FirstName.length > 0) {
      return rowData.FirstName.map(p => p.provider).join(', ');
    }
    return '';
  };

  constructor(service: Service) {
    console.log('Component initialized, fetching employees...');
    
    // Create a custom store to simulate remote operations
    this.dataSource = new CustomStore({
      key: 'ID',
      load: (loadOptions: any) => {
        console.log('Load options:', loadOptions);
        
        return service.getEmployees().toPromise().then((data: Employee[] | undefined) => {
          if (!data) return { data: [], totalCount: 0 };
          this.employees = data;
          let filteredData = [...data];
          
          // Apply filtering if exists
          if (loadOptions.filter) {
            const filter = loadOptions.filter;
            filteredData = this.applyFilter(filteredData, filter);
          }
          
          // Apply paging
          const skip = loadOptions.skip || 0;
          const take = loadOptions.take || 10;
          const pagedData = filteredData.slice(skip, skip + take);
          
          // Track total count for selection
          this.totalCount = filteredData.length;
          console.log('Total count:', this.totalCount);
          
          return {
            data: pagedData,
            totalCount: filteredData.length
          };
        });
      }
    });
  }

  private applyFilter(data: Employee[], filter: any): Employee[] {
    if (!filter) return data;
    
    console.log('Applying filter:', filter);
    
    // Handle complex filter arrays with OR conditions
    if (Array.isArray(filter)) {
      // If first element is array, it's a compound filter
      if (Array.isArray(filter[0])) {
        let result = data;
        
        for (let i = 0; i < filter.length; i++) {
          const element = filter[i];
          
          if (element === 'or') {
            // For OR, combine results from previous and next filter
            const prevFilter = filter[i - 1];
            const nextFilter = filter[i + 1];
            const prevResult = this.applyFilter(data, prevFilter);
            const nextResult = this.applyFilter(data, nextFilter);
            // Combine and deduplicate
            const combined = [...prevResult, ...nextResult];
            result = combined.filter((item, index) => 
              combined.findIndex(t => t.ID === item.ID) === index
            );
            i++; // Skip next element as we already processed it
          } else if (element === 'and') {
            // For AND, apply filters sequentially
            const nextFilter = filter[i + 1];
            result = this.applyFilter(result, nextFilter);
            i++; // Skip next element
          } else if (Array.isArray(element)) {
            // Apply individual filter
            result = this.applyFilter(result, element);
          }
        }
        
        return result;
      }
      
      // Handle simple filter [field, operation, value]
      if (filter.length === 3) {
        const [field, operation, value] = filter;
        
        if (field === 'FirstName') {
          // Filter by provider array
          return data.filter(emp => {
            if (!emp.FirstName || emp.FirstName.length === 0) return false;
            return emp.FirstName.some(p => p.provider === value);
          });
        }
        
        // Handle other fields
        return data.filter(emp => {
          const fieldValue = (emp as any)[field];
          if (operation === '=' || operation === 'contains') {
            return fieldValue === value || (typeof fieldValue === 'string' && fieldValue.includes(value));
          }
          return true;
        });
      }
    }
    
    return data;
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
