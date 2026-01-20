import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";

export enum FirstNameEnum {
  Nan = 'Nan',
  Janet = 'Janet',
  Margaret = 'Margaret',
  Steven = 'Steven',
  Michael = 'Michael'
}

export interface Provider {
  provider: string;
  dateAdded: string | null;
  dateFirstSeen: string;
}

export class Employee {
  ID?: number;

  FirstName?: Provider[];

  LastName?: string;

  Position?: string;

  BirthDate?: string;

  Title?: string;

  Address?: string;

  City?: string;

  Zipcode?: number;

  Email?: string;

  Skype?: string;

  DepartmentID?: number;

  MobilePhone?: string;
}

@Injectable()
export class Service {
  // Using OData Northwind sample API
  private apiUrl = 'https://services.odata.org/V4/Northwind/Northwind.svc/Employees';

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    // Fetch data from OData API and transform it
    return this.http.get<any>(this.apiUrl).pipe(
      map((response) => {
        const employees = response.value || [];
        const enumValues = Object.values(FirstNameEnum);
        
        return employees.map((emp: any, index: number) => {
          // Map OData first names to enum values with provider structure
          let firstName: Provider[] = [];
          const odataFirstName = emp.FirstName;
          const baseDate = new Date('2025-11-03T13:14:23.121Z');
          
          // Helper function to create provider objects
          const createProvider = (providerName: string, dayOffset: number): Provider => ({
            provider: providerName,
            dateAdded: null,
            dateFirstSeen: new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000).toISOString()
          });
          
          // Map actual names to provider enum values
          if (odataFirstName === 'Nancy') {
            firstName = [
              createProvider(FirstNameEnum.Nan, 0),
              createProvider(FirstNameEnum.Janet, 70)
            ];
          } else if (odataFirstName === 'Andrew') {
            firstName = [
              createProvider(FirstNameEnum.Janet, 10),
              createProvider(FirstNameEnum.Margaret, 20),
              createProvider(FirstNameEnum.Steven, 30)
            ];
          } else if (odataFirstName === 'Janet') {
            firstName = [
              createProvider(FirstNameEnum.Margaret, 5),
              createProvider(FirstNameEnum.Michael, 15)
            ];
          } else if (odataFirstName === 'Margaret') {
            firstName = [
              createProvider(FirstNameEnum.Steven, 25),
              createProvider(FirstNameEnum.Michael, 35),
              createProvider(FirstNameEnum.Nan, 45)
            ];
          } else if (odataFirstName === 'Steven') {
            firstName = [
              createProvider(FirstNameEnum.Michael, 40),
              createProvider(FirstNameEnum.Nan, 50)
            ];
          } else if (odataFirstName === 'Michael') {
            firstName = [
              createProvider(FirstNameEnum.Nan, 12),
              createProvider(FirstNameEnum.Janet, 22),
              createProvider(FirstNameEnum.Margaret, 32)
            ];
          } else if (odataFirstName === 'Robert') {
            firstName = [
              createProvider(FirstNameEnum.Steven, 8),
              createProvider(FirstNameEnum.Janet, 18)
            ];
          } else if (odataFirstName === 'Laura') {
            firstName = [
              createProvider(FirstNameEnum.Margaret, 28),
              createProvider(FirstNameEnum.Steven, 38)
            ];
          } else if (odataFirstName === 'Anne') {
            firstName = [
              createProvider(FirstNameEnum.Michael, 48),
              createProvider(FirstNameEnum.Nan, 58),
              createProvider(FirstNameEnum.Janet, 68)
            ];
          } else {
            // Default mapping for any other names
            const nameCount = 2 + (index % 2);
            for (let i = 0; i < nameCount; i++) {
              const randomIndex = (index + i) % enumValues.length;
              firstName.push(createProvider(enumValues[randomIndex], i * 10));
            }
          }
          
          return {
            ID: emp.EmployeeID,
            FirstName: firstName,
            LastName: emp.LastName,
            Position: emp.Title,
            BirthDate: emp.BirthDate,
            Title: emp.TitleOfCourtesy,
            Address: emp.Address,
            City: emp.City,
            Zipcode: emp.PostalCode,
            Email: `${emp.FirstName?.toLowerCase()}@company.com`,
            DepartmentID: emp.ReportsTo || 0
          };
        });
      })
    );
  }
}
