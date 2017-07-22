import * as assert from "power-assert";
import { buildSchemaFromTypeDefinitions } from "graphql-tools";
import * as jest from "jest-mock";
import generateResolvers from "../lib/utils/generate-resolvers";

describe("utils/generate-resolvers", () => {
  describe("root queries", () => {
    let schema, spreadsheet, result;
    describe("are optional", () => {
      beforeEach(() => {
        schema = buildSchemaFromTypeDefinitions(`
          type Product {
            id: Int!
          }

          type Query {
            product: Product
          }
        `);
        spreadsheet = {};
        result = generateResolvers(schema, spreadsheet);
      });
      it("builds Query with only product resolver", () => {
        assert.equal(Object.keys(result.Query).length, 1);
        assert.ok(result.Query.product);
      });
    });
    beforeEach(() => {
      schema = buildSchemaFromTypeDefinitions(`
      type Product {
        id: Int!
      }

      type Query {
        product: Product
        products(id: String!): [Product]
      }
    `);
      spreadsheet = {};
      result = generateResolvers(schema, spreadsheet);
    });

    it("has Query", () => {
      assert.ok(result.Query);
    });

    it("has generated two root resolvers", () => {
      assert.equal(Object.keys(result.Query).length, 2);
    });

    it("has product root resolver", () => {
      assert.ok(result.Query.product);
    });

    it("has products root resolver", () => {
      assert.ok(result.Query.products);
    });

    describe("singular resolver", () => {
      let resolvers;
      beforeEach(async () => {
        spreadsheet = {
          findRecord: jest
            .fn()
            .mockReturnValue(Promise.resolve({ id: "hello-world" })),
        };
        resolvers = generateResolvers(schema, spreadsheet);
        result = await resolvers.Query.product({}, { id: "hello-world" }, {});
      });

      it("invokes spreadsheet.findRecord", () => {
        assert.equal(spreadsheet.findRecord.mock.calls.length, 1);
      });

      it("passes type and id to findRecord", () => {
        assert.deepEqual(spreadsheet.findRecord.mock.calls[0], [
          "Product",
          "hello-world",
        ]);
      });

      it("returned findRecord return value", async () => {
        assert.deepEqual(result, { id: "hello-world" });
      });
    });

    describe("plural resolver", () => {
      let resolvers;
      beforeEach(async () => {
        spreadsheet = {
          findAll: jest
            .fn()
            .mockReturnValue(
              Promise.resolve([{ id: "hello" }, { id: "world" }]),
            ),
        };
        resolvers = generateResolvers(schema, spreadsheet);
        result = await resolvers.Query.products({}, {}, {});
      });

      it("invokes spreadsheet.findAll", () => {
        assert.equal(spreadsheet.findAll.mock.calls.length, 1);
      });

      it("passes type to findAll", () => {
        assert.deepEqual(spreadsheet.findAll.mock.calls[0], ["Product"]);
      });

      it("returned findRecord return value", async () => {
        assert.deepEqual(result, [{ id: "hello" }, { id: "world" }]);
      });
    });
  });

  describe("composed resolvers", () => {
    describe("single", () => {
      const schema = buildSchemaFromTypeDefinitions(`
      type Person {
        id: String!
      }

      type Product {
        id: String!
        owner: Person
        creator: Person!
      }

      type Query {
        person(id: String!): Person
      }
    `);
      let result;
      beforeEach(() => {
        result = generateResolvers(schema, {});
      });
      it("creates composed resolvers", () => {
        assert.ok(result.Product.owner);
        assert.ok(result.Product.creator);
      });
      describe("resolver", () => {
        let spreadsheet, ownerResult, creatorResult;
        beforeEach(() => {
          spreadsheet = {
            findRecord: jest
              .fn()
              .mockReturnValueOnce({ id: "taras" })
              .mockReturnValueOnce({ id: "michael" }),
          };
          let resolvers = generateResolvers(schema, spreadsheet);
          let root = { owner: "taras", creator: "michael" };
          ownerResult = resolvers.Product.owner(root, {}, {});
          creatorResult = resolvers.Product.creator(root, {}, {});
        });
        it("invokes findRecord", () => {
          assert.equal(spreadsheet.findRecord.mock.calls.length, 2);
          assert.deepEqual(spreadsheet.findRecord.mock.calls[0], [
            "Person",
            "taras",
          ]);
          assert.deepEqual(spreadsheet.findRecord.mock.calls[1], [
            "Person",
            "michael",
          ]);
        });
      });
    });
    describe("lists", () => {
      const schema = buildSchemaFromTypeDefinitions(`
      type Person {
        id: String!
        products: [Product]
      }

      type Product {
        id: String!
      }

      type Query {
        person(id: String!): Person
      }
    `);
      let result;
      beforeEach(() => {
        result = generateResolvers(schema, {});
      });
      it("creates composed resolver", () => {
        assert.ok(result.Person.products);
      });
      describe("resolver", () => {
        let spreadsheet, result;
        beforeEach(() => {
          spreadsheet = {
            findRecords: jest
              .fn()
              .mockReturnValue([
                { id: "iphone" },
                { id: "ipad" },
                { id: "macbook" },
              ]),
          };
          let resolvers = generateResolvers(schema, spreadsheet);
          result = resolvers.Person.products(
            { products: "iphone,ipad,macbook" },
            {},
            {},
          );
        });
        it("invokes findRecords", () => {
          assert.equal(spreadsheet.findRecords.mock.calls.length, 1);
          assert.deepEqual(spreadsheet.findRecords.mock.calls[0], [
            "Product",
            ["iphone", "ipad", "macbook"],
          ]);
          assert.deepEqual(result, [
            { id: "iphone" },
            { id: "ipad" },
            { id: "macbook" },
          ]);
        });
      });
    });
  });
});
