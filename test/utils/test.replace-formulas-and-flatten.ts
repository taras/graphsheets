import * as jest from "jest-mock";
import * as assert from "power-assert";
import replaceFormulasAndFlatten from "../../lib/utils/replace-formulas-and-flatten";
import getTypeMapFromSchemaFile from "../helpers/get-type-map";
import { getMutation } from "../../lib/utils/type-map-utils";

describe("replaceFormulasAndFlatten", () => {
  let typeMap = getTypeMapFromSchemaFile("default");
  let mutation = getMutation(typeMap, "createPerson");

  let result;
  beforeEach(() => {
    result = replaceFormulasAndFlatten(mutation, {
      person: {
        id: "1",
        favourite: {
          id: "2"
        },
        products: [
          {
            id: "3",
            owner: {
              id: "4"
            }
          }
        ]
      }
    });
  });
  it("adds relationship formulas for root item", () => {
    assert.deepEqual(result[0], [
      "Person",
      {
        id: "1",
        products: `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='Person' AND C='1' AND D='products' and E='Product'"))`,
        favourite: `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='Person' AND C='1' AND D='favourite' and E='Product'"))`,
        father: `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='Person' AND C='1' AND D='father' and E='Person'"))`
      }
    ]);
  });
  it("adds relationship formulas for list reference", () => {
    assert.deepEqual(result[1], [
      "Product",
      {
        id: "3",
        alternative: `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='Product' AND C='3' AND D='alternative' and E='Product'"))`,
        owner: `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='Product' AND C='3' AND D='owner' and E='Person'"))`
      }
    ]);
  });
  it("adds relationship formulas for recursive single reference", () => {
    assert.deepEqual(result[2], [
      "Person",
      {
        id: "4",
        products: `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='Person' AND C='4' AND D='products' and E='Product'"))`,
        favourite: `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='Person' AND C='4' AND D='favourite' and E='Product'"))`,
        father: `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='Person' AND C='4' AND D='father' and E='Person'"))`
      }
    ]);
  });
  it("adds relationship formulas for single reference", () => {
    assert.deepEqual(result[3], [
      "Product",
      {
        id: "2",
        alternative: `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='Product' AND C='2' AND D='alternative' and E='Product'"))`,
        owner: `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='Product' AND C='2' AND D='owner' and E='Person'"))`
      }
    ]);
  });
});
