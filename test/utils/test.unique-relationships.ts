import * as assert from "power-assert";
import uniqueRelationships from "../../lib/utils/unique-relationships";

describe("unique-relationships", () => {
  it("returns single relationship for relationship of same type", () => {
    assert.deepEqual(
      uniqueRelationships([
        ["Person", "chris", "sibling", "Person", "meg"],
        ["Person", "chris", "sibling", "Person", "ryan"]
      ]),
      [["Person", "chris", "sibling", "Person"]]
    );
  });
});
