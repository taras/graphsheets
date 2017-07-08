import * as assert from "power-assert";
import * as jest from "jest-mock";

import { stripBadResponse } from "../lib/adapters/google-sheets";

describe("GoogleSheetsAdapter", () => {
  describe("stripBadResponse", () => {
    let result;
    beforeEach(() => {
      result = stripBadResponse(`)]}'
{"version":"0.6","reqId":"0","status":"ok","sig":"602097054","table":{"cols":[{"id":"A","label":"id","type":"number","pattern":"General"},{"id":"B","label":"firstName","type":"string"},{"id":"C","label":"lastName","type":"string"},{"id":"D","label":"products","type":"string"},{"id":"E","label":"fullName","type":"string"},{"id":"F","label":"productsCount","type":"number","pattern":"General"}],"rows":[{"c":[{"v":1.0,"f":"1"},{"v":"Taras"},{"v":"Mankovski"},{"v":"2,3,5"},{"v":"Taras Mankovski"},{"v":3.0,"f":"3"}]},{"c":[{"v":2.0,"f":"2"},{"v":"Michael"},{"v":"Luskind"},{"v":"1,4"},{"v":"Michael Luskind"},{"v":2.0,"f":"2"}]}]}}`);
    });

    it("removes bad characters", () => {
      assert.equal(
        result,
        `{"version":"0.6","reqId":"0","status":"ok","sig":"602097054","table":{"cols":[{"id":"A","label":"id","type":"number","pattern":"General"},{"id":"B","label":"firstName","type":"string"},{"id":"C","label":"lastName","type":"string"},{"id":"D","label":"products","type":"string"},{"id":"E","label":"fullName","type":"string"},{"id":"F","label":"productsCount","type":"number","pattern":"General"}],"rows":[{"c":[{"v":1.0,"f":"1"},{"v":"Taras"},{"v":"Mankovski"},{"v":"2,3,5"},{"v":"Taras Mankovski"},{"v":3.0,"f":"3"}]},{"c":[{"v":2.0,"f":"2"},{"v":"Michael"},{"v":"Luskind"},{"v":"1,4"},{"v":"Michael Luskind"},{"v":2.0,"f":"2"}]}]}}`
      );
    });
  });
});
