import { createReadStream } from "fs";
import * as jest from "jest-mock";
import * as assert from "power-assert";

import {
  injectIds,
  default as createRecordResolver
} from "../../lib/resolvers/create";

import { buildSchemaFromTypeDefinitions } from "graphql-tools/dist";
import { getMutation } from "../../lib/utils/type-map-utils";
import getTypeMapFromSchemaFile from "../helpers/get-type-map";

describe("resolvers/create", () => {
  let typeMap = getTypeMapFromSchemaFile("default");
  let mutation = getMutation(typeMap, "createPerson");
  describe("resolver", () => {
    let spreadsheet, resolver;
    beforeEach(() => {
      spreadsheet = {
        newId: jest.fn(),
        createRecord: jest.fn(),
        createRelationship: jest.fn()
      };
      resolver = createRecordResolver(spreadsheet, mutation);
    });
    it("creates a single object", async () => {
      spreadsheet.newId.mockReturnValue("a");
      spreadsheet.createRecord.mockReturnValue({ id: "a" });
      let result = await resolver({}, { person: {} });

      assert.equal(spreadsheet.newId.mock.calls.length, 1);
      assert.equal(spreadsheet.createRecord.mock.calls.length, 1);
      assert.deepEqual(spreadsheet.createRecord.mock.calls[0], [
        "Person",
        {
          id: "a",
          father:
            "=JOIN(\",\", QUERY(RELATIONSHIPS!A:F, \"SELECT F WHERE B='Person' AND C='a' AND D='father' and E='Person'\"))",
          favourite:
            "=JOIN(\",\", QUERY(RELATIONSHIPS!A:F, \"SELECT F WHERE B='Person' AND C='a' AND D='favourite' and E='Product'\"))",
          products:
            "=JOIN(\",\", QUERY(RELATIONSHIPS!A:F, \"SELECT F WHERE B='Person' AND C='a' AND D='products' and E='Product'\"))"
        }
      ]);
      assert.deepEqual(result, {
        id: "a"
      });
    });
    it("creates a single object with object references", async () => {
      spreadsheet.newId.mockReturnValueOnce("a").mockReturnValueOnce("b");
      spreadsheet.createRecord
        .mockReturnValueOnce({ id: "a" })
        .mockReturnValueOnce({ id: "b" });
      let result = await resolver(
        {},
        {
          person: {
            father: {}
          }
        }
      );
      assert.equal(spreadsheet.newId.mock.calls.length, 2);
      assert.equal(spreadsheet.createRecord.mock.calls.length, 2);
      assert.equal(spreadsheet.createRelationship.mock.calls.length, 1);
      assert.deepEqual(spreadsheet.createRelationship.mock.calls[0], [
        "Person",
        "a",
        "father",
        "Person",
        "b"
      ]);
    });
  });
  describe("injectId", () => {
    let actions;
    beforeEach(() => {
      let id = 1;
      actions = {
        generateId: jest.fn(() => {
          return `${id++}`;
        })
      };
    });
    it("adds id to top entry hash", async () => {
      assert.deepEqual(injectIds(mutation, { person: {} }, actions), {
        person: { id: "1" }
      });
    });
    it("leaves id as is when present", async () => {
      assert.deepEqual(
        injectIds(mutation, { person: { id: "peter" } }, actions),
        {
          person: { id: "peter" }
        }
      );
    });
    it("adds ids to single references", async () => {
      assert.deepEqual(
        injectIds(
          mutation,
          {
            person: { father: {} }
          },
          actions
        ),
        {
          person: {
            id: "1",
            father: { id: "2" }
          }
        }
      );
    });
    it("adds ids to list reference", async () => {
      assert.deepEqual(
        injectIds(
          mutation,
          {
            person: {
              products: [{}, {}]
            }
          },
          actions
        ),
        {
          person: {
            id: "1",
            products: [{ id: "2" }, { id: "3" }]
          }
        }
      );
    });
    describe("scalar properties from input properties", () => {
      it("maintains scalars", async () => {
        assert.deepEqual(
          injectIds(
            mutation,
            {
              person: {
                name: "peter griffin"
              }
            },
            actions
          ),
          {
            person: {
              id: "1",
              name: "peter griffin"
            }
          }
        );
      });
      it("maintains scalars recursively", async () => {
        assert.deepEqual(
          injectIds(
            mutation,
            {
              person: {
                products: [{ title: "shoes" }],
                father: {
                  name: "peter griffin"
                }
              }
            },
            actions
          ),
          {
            person: {
              id: "1",
              products: [{ id: "2", title: "shoes" }],
              father: {
                id: "3",
                name: "peter griffin"
              }
            }
          }
        );
      });
    });
  });
});
