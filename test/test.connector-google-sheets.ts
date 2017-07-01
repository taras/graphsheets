import * as assert from "power-assert";
import * as jest from "jest-mock";

import GoogleSheetsAdapter from "../lib/adapters/google-sheets";
import GoogleSheetsConnector from "../lib/connectors/google-sheets";
import { IAuthorizer } from "../lib/Interfaces";

describe("GoogleSheetsConnector", () => {
  class StubAuthorizer implements IAuthorizer {
    public isAuthorized = true;

    authorizeRequest(payload) {
      return payload;
    }
  }

  beforeEach(() => {
    let authorizer = new StubAuthorizer();
    this.adapter = new GoogleSheetsAdapter(authorizer);
    this.subject = new GoogleSheetsConnector(this.adapter);
  });

  describe("fetchHeaders", () => {
    it("parses headers from payload", async () => {
      const payload = {
        spreadsheetId: "some_id",
        valueRanges: [
          {
            range: "Product!A1:C1",
            majorDimension: "ROWS",
            values: [["id", "title", "owner"]]
          },
          {
            range: "Person!A1:F1",
            majorDimension: "ROWS",
            values: [["id", "firstName", "lastName", "products"]]
          }
        ]
      };
      this.adapter.batchGet = jest
        .fn()
        .mockReturnValue(Promise.resolve(payload));

      let result = await this.subject.fetchHeaders("some_id", [
        "Product",
        "Person"
      ]);

      assert.deepEqual(result, {
        Product: ["id", "title", "owner"],
        Person: ["id", "firstName", "lastName", "products"]
      });

      assert.deepEqual(this.adapter.batchGet.mock.calls, [
        [{ sheets: "Product!A1:ZZ1,Person!A1:ZZ1", spreadsheetId: "some_id" }]
      ]);
    });
  });
});
