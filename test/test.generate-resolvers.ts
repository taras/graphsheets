import * as assert from "power-assert";
import * as jest from "jest-mock";
import { buildSchemaFromTypeDefinitions } from "graphql-tools";
import generateResolvers from "../lib/utils/generate-resolvers";

describe("root queries", () => {
  beforeEach(() => {
    this.schema = buildSchemaFromTypeDefinitions(`
      type Product {
        id: Int!
      }

      type Query {
        product: Product
        products(id: String!): [Product]
      }
    `);
    this.spreadsheet = {};
    this.result = generateResolvers(this.schema, this.spreadsheet);
  });

  it("has Query", () => {
    assert.ok(this.result.Query);
  });

  it("has generated two root resolvers", () => {
    assert.equal(Object.keys(this.result.Query).length, 2);
  });

  it("has product root resolver", () => {
    assert.ok(this.result.Query.product);
  });

  it("has products root resolver", () => {
    assert.ok(this.result.Query.products);
  });

  describe("singular resolver", () => {
    beforeEach(async () => {
      this.spreadsheet = {
        findRecord: jest
          .fn()
          .mockReturnValue(Promise.resolve({ id: "hello-world" }))
      };
      this.resolvers = generateResolvers(this.schema, this.spreadsheet);
      this.result = await this.resolvers.Query.product(
        {},
        { id: "hello-world" },
        {}
      );
    });

    it("invokes spreadsheet.findRecord", () => {
      assert.equal(this.spreadsheet.findRecord.mock.calls.length, 1);
    });

    it("passes type and id to findRecord", () => {
      assert.deepEqual(this.spreadsheet.findRecord.mock.calls[0], [
        "Product",
        "hello-world"
      ]);
    });

    it("returned findRecord return value", async () => {
      assert.deepEqual(this.result, { id: "hello-world" });
    });
  });

  describe("plural resolver", () => {
    beforeEach(async () => {
      this.spreadsheet = {
        findAll: jest
          .fn()
          .mockReturnValue(Promise.resolve([{ id: "hello" }, { id: "world" }]))
      };
      this.resolvers = generateResolvers(this.schema, this.spreadsheet);
      this.result = await this.resolvers.Query.products({}, {}, {});
    });

    it("invokes spreadsheet.findAll", () => {
      assert.equal(this.spreadsheet.findAll.mock.calls.length, 1);
    });

    it("passes type to findAll", () => {
      assert.deepEqual(this.spreadsheet.findAll.mock.calls[0], ["Product"]);
    });

    it("returned findRecord return value", async () => {
      assert.deepEqual(this.result, [{ id: "hello" }, { id: "world" }]);
    });
  });
});
