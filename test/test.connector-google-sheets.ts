import * as assert from "power-assert";
import * as jest from "jest-mock";

import GoogleSheetsAdapter from "../lib/adapters/google-sheets";
import {
  default as GoogleSheetsConnector,
  extractHeaders,
  deserializeTableQueryResponse
} from "../lib/connectors/google-sheets";
import { IAuthorizer } from "../lib/Interfaces";
import Sheet from "../lib/models/sheet";
import Spreadsheet from "../lib/models/spreadsheet";
import spreadsheetFixture from "./fixtures/spreadsheet";
import tableQueryFixture from "./fixtures/table-query";

describe("GoogleSheetsConnector", () => {
  describe("load", () => {
    class StubAuthorizer implements IAuthorizer {
      public isAuthorized = true;

      authorizeRequest(payload) {
        return payload;
      }

      getAuthorizationHeader() {
        return "Bearer Yogi";
      }
    }

    beforeEach(() => {
      let authorizer = new StubAuthorizer();
      this.adapter = new GoogleSheetsAdapter(authorizer);
      this.subject = new GoogleSheetsConnector(this.adapter);
    });

    it("fetches spreadsheet", async () => {
      const payload = spreadsheetFixture;
      this.adapter.get = jest.fn().mockReturnValue(Promise.resolve(payload));

      let ss = await this.subject.load(
        "1kjeHcZKwW5aWc9MPbyBiy3ByVgHdkDi-H3ihuBKmEPQ",
        ["Product", "Person"]
      );

      assert.ok(ss instanceof Spreadsheet);
      assert.equal(ss.id, "1kjeHcZKwW5aWc9MPbyBiy3ByVgHdkDi-H3ihuBKmEPQ");
      assert.equal(ss.title, "GraphSheets Example");
      assert.equal(
        ss.url,
        "https://docs.google.com/spreadsheets/d/1kjeHcZKwW5aWc9MPbyBiy3ByVgHdkDi-H3ihuBKmEPQ/edit"
      );

      // assert.ok(ss.sheets[0] instanceof Sheet);
      // assert.equal(ss.sheets[0].title, "Person");
      // assert.deepEqual(ss.sheets[0].headers, [
      //   {
      //     title: "id",
      //     note: undefined
      //   },
      //   {
      //     title: "firstName",
      //     note: undefined
      //   },
      //   {
      //     title: "lastName",
      //     note: undefined
      //   },
      //   {
      //     title: "products",
      //     note: undefined
      //   },
      //   {
      //     title: "fullName",
      //     note: undefined
      //   },
      //   {
      //     title: "productsCount",
      //     note: undefined
      //   }
      // ]);
      // assert.ok(ss.sheets[1] instanceof Sheet);

      // assert.deepEqual(this.adapter.get.mock.calls, [
      //   [
      //     {
      //       includeGridData: true,
      //       ranges: "Product!A1:ZZ1,Person!A1:ZZ1",
      //       spreadsheetId: "1kjeHcZKwW5aWc9MPbyBiy3ByVgHdkDi-H3ihuBKmEPQ"
      //     }
      //   ]
      // ]);
    });
  });

  describe("extractHeaders", () => {
    it("returns an array of headers", function() {
      let { data } = spreadsheetFixture.sheets[0];
      assert.deepEqual(extractHeaders(data), [
        {
          title: "id",
          note: undefined
        },
        {
          title: "firstName",
          note: undefined
        },
        {
          title: "lastName",
          note: undefined
        },
        {
          title: "products",
          note: undefined
        },
        {
          title: "fullName",
          note: undefined
        },
        {
          title: "productsCount",
          note: undefined
        }
      ]);
    });
  });
});

describe("deserializeTableQueryResponse", () => {
  beforeEach(() => {
    this.result = deserializeTableQueryResponse(tableQueryFixture);
  });

  it("produces an array of object", () => {
    assert.deepEqual(this.result, [
      {
        id: 1,
        firstName: "Taras",
        lastName: "Mankovski",
        products: "2,3,5",
        fullName: "Taras Mankovski",
        productsCount: 3
      },
      {
        id: 2,
        firstName: "Michael",
        lastName: "Luskind",
        products: "1,4",
        fullName: "Michael Luskind",
        productsCount: 2
      }
    ]);
  });
});
