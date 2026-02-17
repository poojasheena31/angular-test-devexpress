import { bootstrapApplication } from "@angular/platform-browser";
import { Component, provideZoneChangeDetection } from "@angular/core";
import { DxDataGridModule } from "devextreme-angular";
import ODataStore from "devextreme/data/odata/store";
import { DataSource } from "devextreme/common/data";

@Component({
  selector: "demo-app",
  templateUrl: "./app.component.html",
  standalone: true,
  imports: [DxDataGridModule],
})
export class AppComponent {
  dataSource: any;

  remoteOperations = {
    filtering: true,
    paging: false,
    sorting: false,
    selection: false,
  };

  cityFilterDataSource = [
    { text: "Boise", value: "Boise" },
    { text: "San Francisco", value: "San Francisco" },
    { text: "Seattle", value: "Seattle" },
  ];

  constructor() {
const dataStore = new ODataStore({
      url: "http://localhost:5005/odata/users",
      key: "UserName",
      keyType: "String",
      version: 4,
      beforeSend: (e) => {
        if (e.params["$filter"]) {
          const cityPattern = /contains\(CityNamesFlat,\s*'([^']*)'\)/gi;
          e.params["$filter"] = e.params["$filter"].replace(cityPattern, (_match: any, val: any) => {
             return `AddressInfo/any(a: contains(a/City/Name, '${val}'))`;
          });

          const tagPattern = /contains\(.*TagsFlat.*,\s*'([^']*)'\)/gi;
    e.params["$filter"] = e.params["$filter"].replace(tagPattern, (_match: any, val: any) => {
      return `ItemMetadata/Tags/any(t: contains(tolower(t/Label), '${val}'))`;
    });
        }
      }
    });

    this.dataSource = new DataSource({
      store: dataStore,
      postProcess: (data) => {
        
        data.forEach((item: any) => {
          item.TagsFlat = item.ItemMetadata?.Tags?.map((t: any) => t.Label).join(", ") || "";
          item.CityNamesFlat = item.AddressInfo
            ? item.AddressInfo.map((addr: any) => addr.City?.Name).join(", ")
            : "";
        });
        return data;
      },
    });
  }

calculateTagFilter = (filterValue: any) => {
    return ["TagsFlat", "contains", filterValue];
  };

  calculateCityFilter = (
    filterValue: any,
    selectedFilterOperation: string | null,
    target: string,
  ) => {
    return ["CityNamesFlat", "contains", filterValue];
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true }),
  ],
}).catch((err) => console.error("Bootstrap error:", err));
