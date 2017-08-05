import extractRelationships from "../../lib/utils/extract-relationships";
import * as jest from "jest-mock";
import * as assert from "power-assert";
import getTypeMapFromSchemaFile from "../helpers/get-type-map";
import { getMutation } from "../../lib/utils/type-map-utils";

describe("extractRelationships", () => {
  let typeMap = getTypeMapFromSchemaFile("default");
  let mutation = getMutation(typeMap, "createPerson");

  it("extracts relationships for shallow single reference", () => {
    assert.deepEqual(
      extractRelationships(mutation, {
        person: {
          id: "1",
          father: { id: "2" }
        }
      }),
      [["Person", "1", "father", "Person", "2"]]
    );
  });
  it("extracts relationships for shallow list references", () => {
    assert.deepEqual(
      extractRelationships(mutation, {
        person: {
          id: "1",
          products: [{ id: "2" }]
        }
      }),
      [["Person", "1", "products", "Product", "2"]]
    );
  });
  it("extracts relationshios from multiple items in a shllow list reference", () => {
    assert.deepEqual(
      extractRelationships(mutation, {
        person: {
          id: "1",
          products: [{ id: "2" }, { id: "3" }]
        }
      }),
      [
        ["Person", "1", "products", "Product", "2"],
        ["Person", "1", "products", "Product", "3"]
      ]
    );
  });
  it("extracts relationships from deep single reference", () => {
    assert.deepEqual(
      extractRelationships(mutation, {
        person: {
          id: "1",
          favourite: {
            id: "2",
            owner: {
              id: "3"
            }
          }
        }
      }),
      [
        ["Person", "1", "favourite", "Product", "2"],
        ["Product", "2", "owner", "Person", "3"]
      ]
    );
  });
  it("extracts realtionships from deep list references", () => {
    assert.deepEqual(
      extractRelationships(mutation, {
        person: {
          id: "1",
          products: [
            {
              id: "2",
              owner: {
                id: "3"
              }
            },
            {
              id: "4",
              owner: {
                id: "5"
              }
            }
          ]
        }
      }),
      [
        ["Person", "1", "products", "Product", "2"],
        ["Product", "2", "owner", "Person", "3"],
        ["Person", "1", "products", "Product", "4"],
        ["Product", "4", "owner", "Person", "5"]
      ]
    );
  });
});
