import * as assert from "power-assert";
import * as jest from "jest-mock";

import GoogleSheetsAdapter from "../../lib/adapters/google-sheets";
import {
  default as GoogleSheetsConnector,
  deserializeTableQueryResponse,
  extractHeaders,
  parseValue
} from "../../lib/connectors/google-sheets";
import { IAuthorizer } from "../../lib/Interfaces";
import Sheet from "../../lib/models/sheet";
import Spreadsheet from "../../lib/models/spreadsheet";
import spreadsheetFixture from "./../fixtures/spreadsheet";
import tableQueryFixture from "./../fixtures/table-query";

describe("connectors/google-sheets", () => {
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

  describe("deserializeTableQueryResponse", () => {
    let result;
    beforeEach(() => {
      result = deserializeTableQueryResponse(tableQueryFixture);
    });

    it("produces an array of object", () => {
      assert.deepEqual(result, [
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

  describe("parseValue", () => {
    it("returns null when receives null", () => {
      assert.equal(parseValue(null), null);
    });
    it("returns value when value is wrapped in object", () => {
      assert.equal(parseValue({ v: "hello" }), "hello");
      assert.equal(parseValue({ v: null }), null);
    });
    it("results null when value is #N/A", () => {
      assert.equal(parseValue({ v: "#N/A" }), null);
    });
  });
});
