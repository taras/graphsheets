import * as assert from "power-assert";
import { buildSchemaFromTypeDefinitions } from "graphql-tools";
import * as jest from "jest-mock";
import {
  isDefinedQuery,
  onlyComposite,
  default as generateResolvers
} from "../lib/utils/generate-resolvers";
import onlyObjectTypes from "../lib/utils/only-object-types";

const { keys } = Object;

describe("root queries", () => {
  describe("are optional", () => {
    beforeEach(() => {
      this.schema = buildSchemaFromTypeDefinitions(`
        type Product {
          id: Int!
        }

        type Query {
          product: Product
        }
      `);
      this.spreadsheet = {};
      this.result = generateResolvers(this.schema, this.spreadsheet);
    });
    it("builds Query with only product resolver", () => {
      assert.equal(Object.keys(this.result.Query).length, 1);
      assert.ok(this.result.Query.product);
    });
  });
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

describe("isDefinedQuery", () => {
  beforeEach(() => {
    this.schema = buildSchemaFromTypeDefinitions(`
      type Query {
        hello: String
      }
    `);
    this.typesMap = this.schema.getTypeMap();
  });

  it("detects correctly", () => {
    assert.ok(isDefinedQuery(this.typesMap, "hello") === true);
    assert.ok(isDefinedQuery(this.typesMap, "world") === false);
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
            .mockReturnValueOnce({ id: "michael" })
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
          "taras"
        ]);
        assert.deepEqual(spreadsheet.findRecord.mock.calls[1], [
          "Person",
          "michael"
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
              { id: "macbook" }
            ])
        };
        let resolvers = generateResolvers(schema, spreadsheet);
        result = resolvers.Person.products(
          { products: "iphone,ipad,macbook" },
          {},
          {}
        );
      });
      it("invokes findRecords", () => {
        assert.equal(spreadsheet.findRecords.mock.calls.length, 1);
        assert.deepEqual(spreadsheet.findRecords.mock.calls[0], [
          "Product",
          ["iphone", "ipad", "macbook"]
        ]);
        assert.deepEqual(result, [
          { id: "iphone" },
          { id: "ipad" },
          { id: "macbook" }
        ]);
      });
    });
  });
});

describe("onlyComposite", () => {
  let result;
  const schema = buildSchemaFromTypeDefinitions(`
    type Person {
      id: String!
    }

    type Product {
      id: String!
      owner: Person
      creator: Person!
      inPackage: [Product]
    }

    type Query {
      person(id: String!): Person
    }
  `);
  beforeEach(() => {
    let typeMap = schema.getTypeMap();
    let Product = onlyObjectTypes(typeMap).Product;
    result = onlyComposite(Product.getFields());
  });
  it("returns only 3 items", () => {
    assert.equal(keys(result).length, 3);
  });
  it("returns 3 composite fields", () => {
    assert.ok(result.owner);
    assert.ok(result.creator);
    assert.ok(result.inPackage);
  });
});
