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

export interface EmployeeAlias {
  fsname: string;
  name: string;
  nickname: string;
}

export class Employee {
  ID?: number;

  FirstName?: EmployeeAlias[];

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
          // Map OData first names to alias structure
          let firstName: EmployeeAlias[] = [];
          const odataFirstName = emp.FirstName;
          
          // Helper function to create alias objects
          const createAlias = (fsname: string, name: string): EmployeeAlias => ({
            fsname: fsname,
            name: name,
            nickname: name.substring(0, 4).toLowerCase()
          });
          
          // Map actual names to alias values
          if (odataFirstName === 'Nancy') {
            firstName = [
              createAlias(FirstNameEnum.Nan, 'Nancy'),
              createAlias(FirstNameEnum.Janet, 'Janet')
            ];
          } else if (odataFirstName === 'Andrew') {
            firstName = [
              createAlias(FirstNameEnum.Janet, 'Janet'),
              createAlias(FirstNameEnum.Margaret, 'Margaret'),
              createAlias(FirstNameEnum.Steven, 'Steven')
            ];
          } else if (odataFirstName === 'Janet') {
            firstName = [
              createAlias(FirstNameEnum.Margaret, 'Margaret'),
              createAlias(FirstNameEnum.Michael, 'Michael')
            ];
          } else if (odataFirstName === 'Margaret') {
            firstName = [
              createAlias(FirstNameEnum.Steven, 'Steven'),
              createAlias(FirstNameEnum.Michael, 'Michael'),
              createAlias(FirstNameEnum.Nan, 'Nancy')
            ];
          } else if (odataFirstName === 'Steven') {
            firstName = [
              createAlias(FirstNameEnum.Michael, 'Michael'),
              createAlias(FirstNameEnum.Nan, 'Nancy')
            ];
          } else if (odataFirstName === 'Michael') {
            firstName = [
              createAlias(FirstNameEnum.Nan, 'Nancy'),
              createAlias(FirstNameEnum.Janet, 'Janet'),
              createAlias(FirstNameEnum.Margaret, 'Margaret')
            ];
          } else if (odataFirstName === 'Robert') {
            firstName = [
              createAlias(FirstNameEnum.Steven, 'Steven'),
              createAlias(FirstNameEnum.Janet, 'Janet')
            ];
          } else if (odataFirstName === 'Laura') {
            firstName = [
              createAlias(FirstNameEnum.Margaret, 'Margaret'),
              createAlias(FirstNameEnum.Steven, 'Steven')
            ];
          } else if (odataFirstName === 'Anne') {
            firstName = [
              createAlias(FirstNameEnum.Michael, 'Michael'),
              createAlias(FirstNameEnum.Nan, 'Nancy'),
              createAlias(FirstNameEnum.Janet, 'Janet')
            ];
          } else {
            // Default mapping for any other names
            const nameCount = 2 + (index % 2);
            for (let i = 0; i < nameCount; i++) {
              const randomIndex = (index + i) % enumValues.length;
              firstName.push(createAlias(enumValues[randomIndex], enumValues[randomIndex]));
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
