import {
  reduceTypeMap,
  isDefinedQuery,
  onlyComposite,
  isDefinedMutation,
  getTypeMap,
  reduceMutationArguments,
  reduceInputObjectType,
  getType,
  reduceType
} from "../lib/utils/type-map-utils";
import { buildSchemaFromTypeDefinitions } from "graphql-tools";
import * as jest from "jest-mock";
import * as assert from "power-assert";
import onlyObjectTypes from "../lib/utils/only-object-types";
import {
  GraphQLInputObjectType,
  GraphQLNamedType,
  GraphQLObjectType
} from "graphql";

const { keys } = Object;

describe("utils/type-map-utils", () => {
  describe("isDefinedMutation", () => {
    let schema, typesMap;
    beforeEach(() => {
      schema = buildSchemaFromTypeDefinitions(`
          type Person {
            id: String!
            firstName: String
            lastName: String
          }

          type Query {
            person: Person
          }

          input PersonInput {
            firstName: String
            lastName: String
          }

          type Mutation {
            createPerson(person: PersonInput): Person
          }
        `);
      typesMap = schema.getTypeMap();
    });

    it("detects registered mutations", () => {
      assert.ok(isDefinedMutation(typesMap, "createPerson"));
      assert.ok(!isDefinedMutation(typesMap, "updatePerson"));
    });
  });

  describe("isDefinedQuery", () => {
    let schema, typesMap;
    beforeEach(() => {
      schema = buildSchemaFromTypeDefinitions(`
      type Query {
        hello: String
      }
    `);
      typesMap = schema.getTypeMap();
    });

    it("detects correctly", () => {
      assert.ok(isDefinedQuery(typesMap, "hello") === true);
      assert.ok(isDefinedQuery(typesMap, "world") === false);
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
      let Product = schema.getType("Product") as GraphQLObjectType;
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
  describe("reduceTypeMap", () => {
    let result, callback;
    beforeEach(() => {
      let typeDefs = `
      type Person {
        mother: Person
        products: [Product]
        references: [String]
      }

      type Product {
        owner: Person!
        related: [Product!]
      }

      type Query {
        persons: [Person]
      }
    `;
      let schema = buildSchemaFromTypeDefinitions(typeDefs);
      callback = jest.fn((result, type, field, reference) => {
        return [...result, `${type.name}.${field.name}.${reference.name}`];
      });
      result = reduceTypeMap(schema.getTypeMap(), callback, []);
    });
    it("invokes callback for every property of object type", () => {
      assert.equal(callback.mock.calls.length, 4);
    });
    it("invokes callback for single reference", () => {
      assert.deepEqual(callback.mock.calls[0][0], []);
      assert.equal(callback.mock.calls[0][1].name, "Person");
      assert.equal(callback.mock.calls[0][2].name, "mother");
      assert.equal(callback.mock.calls[0][3].name, "Person");
      assert.deepEqual(callback.mock.calls[0][4], {
        isList: false,
        isNonNull: false
      });
    });
    it("invokes callback for list reference", () => {
      assert.deepEqual(callback.mock.calls[1][0], ["Person.mother.Person"]);
      assert.equal(callback.mock.calls[1][1].name, "Person");
      assert.equal(callback.mock.calls[1][2].name, "products");
      assert.equal(callback.mock.calls[1][3].name, "Product");
      assert.deepEqual(callback.mock.calls[1][4], {
        isList: true,
        isNonNull: false
      });
    });
    it("invokes callback for required reference", () => {
      assert.deepEqual(callback.mock.calls[2][0], [
        "Person.mother.Person",
        "Person.products.Product"
      ]);
      assert.equal(callback.mock.calls[2][1].name, "Product");
      assert.equal(callback.mock.calls[2][2].name, "owner");
      assert.equal(callback.mock.calls[2][3].name, "Person");
      assert.deepEqual(callback.mock.calls[2][4], {
        isList: false,
        isNonNull: true
      });
    });
    it("invokes callback for required list reference", () => {
      assert.deepEqual(callback.mock.calls[3][0], [
        "Person.mother.Person",
        "Person.products.Product",
        "Product.owner.Person"
      ]);
      assert.equal(callback.mock.calls[3][1].name, "Product");
      assert.equal(callback.mock.calls[3][2].name, "related");
      assert.equal(callback.mock.calls[3][3].name, "Product");
      assert.deepEqual(callback.mock.calls[3][4], {
        isList: true,
        isNonNull: false
      });
    });
    it("returns accumulated value", () => {
      assert.deepEqual(result, [
        "Person.mother.Person",
        "Person.products.Product",
        "Product.owner.Person",
        "Product.related.Product"
      ]);
    });
  });

  describe("reduceMutation", () => {
    let schema = buildSchemaFromTypeDefinitions(`
      type Product {
        title: String
      }

      type Query {
        products: [Product]
      }

      input ProductInput {
        title: String
        price: Float
        quantity: Int
        related: [ProductInput]
        alternative: ProductInput!
      }

      type Mutation {
        createProduct(
          product: ProductInput, 
          products: [ProductInput]
          requiredProduct: ProductInput!
        ): Product
      }
    `);
    let typeMap = getTypeMap(schema);
    describe("reduceInputObjectType", () => {
      let callback, result;
      beforeEach(() => {
        // why do i need to do this?
        let getInputType = typeMap => typeMap.ProductInput;
        let ProductInput = getInputType(typeMap);
        callback = jest.fn((result, name, type) => {
          return {
            ...result,
            [name]: type.name
          };
        });
        result = reduceInputObjectType(ProductInput, callback);
      });
      it("invokes callback 5 times", () => {
        assert.equal(callback.mock.calls.length, 5);
      });
      it("passes expected arguments for String type", () => {
        assert.deepEqual(callback.mock.calls[0][0], {});
        assert.equal(callback.mock.calls[0][1], "title");
        assert.equal(callback.mock.calls[0][2].name, "String");
        assert.deepEqual(callback.mock.calls[0][3], {
          isScalar: true,
          isList: false,
          isNonNull: false,
          isInput: false
        });
      });
      it("passes expected arguments for Float", () => {
        assert.deepEqual(callback.mock.calls[1][0], {
          title: "String"
        });
        assert.equal(callback.mock.calls[1][1], "price");
        assert.equal(callback.mock.calls[1][2].name, "Float");
        assert.deepEqual(callback.mock.calls[1][3], {
          isScalar: true,
          isList: false,
          isNonNull: false,
          isInput: false
        });
      });
      it("passes expect arguments for Int", () => {
        assert.deepEqual(callback.mock.calls[2][0], {
          title: "String",
          price: "Float"
        });
        assert.equal(callback.mock.calls[2][1], "quantity");
        assert.equal(callback.mock.calls[2][2].name, "Int");
        assert.deepEqual(callback.mock.calls[2][3], {
          isScalar: true,
          isList: false,
          isNonNull: false,
          isInput: false
        });
      });
      it("passes expect arguments for List ProductInput", () => {
        assert.deepEqual(callback.mock.calls[3][0], {
          title: "String",
          price: "Float",
          quantity: "Int"
        });
        assert.equal(callback.mock.calls[3][1], "related");
        assert.equal(callback.mock.calls[3][2].name, "ProductInput");
        assert.deepEqual(callback.mock.calls[3][3], {
          isScalar: false,
          isList: true,
          isNonNull: false,
          isInput: true
        });
      });
      it("passes expect arguments for NonNull ProductInput", () => {
        assert.deepEqual(callback.mock.calls[4][0], {
          title: "String",
          price: "Float",
          quantity: "Int",
          related: "ProductInput"
        });
        assert.equal(callback.mock.calls[4][1], "alternative");
        assert.equal(callback.mock.calls[4][2].name, "ProductInput");
        assert.deepEqual(callback.mock.calls[4][3], {
          isScalar: false,
          isList: false,
          isNonNull: true,
          isInput: true
        });
      });
      it("returns last value", () => {
        assert.deepEqual(result, {
          title: "String",
          price: "Float",
          quantity: "Int",
          related: "ProductInput",
          alternative: "ProductInput"
        });
      });
    });
    describe("reduceMutationArguments", () => {
      let callback, result;
      beforeEach(() => {
        let { Mutation } = typeMap;
        let { createProduct } = Mutation.getFields();
        callback = jest.fn((result, name, type, info) => {
          return [...result, name];
        });
        result = reduceMutationArguments(createProduct, callback, []);
      });

      it("invokes callback 3 times", () => {
        assert.equal(callback.mock.calls.length, 3);
      });
      it("detects single argument", () => {
        assert.deepEqual(callback.mock.calls[0][0], []);
        assert.equal(callback.mock.calls[0][1], "product");
        assert.equal(callback.mock.calls[0][2].name, "ProductInput");
        assert.deepEqual(callback.mock.calls[0][3], {
          isScalar: false,
          isList: false,
          isNonNull: false,
          isInput: true
        });
      });
      it("detects list argument", () => {
        assert.deepEqual(callback.mock.calls[1][0], ["product"]);
        assert.equal(callback.mock.calls[1][1], "products");
        assert.equal(callback.mock.calls[1][2].name, "ProductInput");
        assert.deepEqual(callback.mock.calls[1][3], {
          isScalar: false,
          isList: true,
          isNonNull: false,
          isInput: true
        });
      });
      it("detects required argument", () => {
        assert.deepEqual(callback.mock.calls[2][0], ["product", "products"]);
        assert.equal(callback.mock.calls[2][1], "requiredProduct");
        assert.equal(callback.mock.calls[2][2].name, "ProductInput");
        assert.deepEqual(callback.mock.calls[2][3], {
          isScalar: false,
          isList: false,
          isNonNull: true,
          isInput: true
        });
      });
      it("returns last value", () => {
        assert.deepEqual(result, ["product", "products", "requiredProduct"]);
      });
    });
  });

  describe("reduceType", () => {
    let schema = buildSchemaFromTypeDefinitions(`
      type Person {
        id: ID!
        name: String
        age: Int
        father: Person
        products: [Product]
      }

      type Product {
        id: ID!
        title: String
      }

      type Query {
        person(id: String): Person
      }
    `);
    let typeMap = schema.getTypeMap();
    let Person = getType(typeMap, "Person") as GraphQLObjectType;
    let callback, result;
    beforeEach(() => {
      callback = jest.fn((result, key, { name }) => {
        return {
          ...result,
          [key]: name
        };
      });
      result = reduceType(Person, callback);
    });
    it("invokes callback 5 times", () => {
      assert.equal(callback.mock.calls.length, 5);
    });
    it("expected arguments for ID field", () => {
      assert.deepEqual(callback.mock.calls[0][0], {});
      assert.equal(callback.mock.calls[0][1], "id");
      assert.equal(callback.mock.calls[0][2].name, "ID");
      assert.deepEqual(callback.mock.calls[0][3], {
        isScalar: true,
        isList: false,
        isNonNull: true,
        isObject: false
      });
    });
    it("expected arguments for String field", () => {
      assert.deepEqual(callback.mock.calls[1][0], {
        id: "ID"
      });
      assert.equal(callback.mock.calls[1][1], "name");
      assert.equal(callback.mock.calls[1][2].name, "String");
      assert.deepEqual(callback.mock.calls[1][3], {
        isScalar: true,
        isList: false,
        isNonNull: false,
        isObject: false
      });
    });
    it("expected arguments for Int", () => {
      assert.deepEqual(callback.mock.calls[2][0], {
        id: "ID",
        name: "String"
      });
      assert.equal(callback.mock.calls[2][1], "age");
      assert.equal(callback.mock.calls[2][2].name, "Int");
      assert.deepEqual(callback.mock.calls[2][3], {
        isScalar: true,
        isList: false,
        isNonNull: false,
        isObject: false
      });
    });
    it("expected arguments for single reference", () => {
      assert.deepEqual(callback.mock.calls[3][0], {
        id: "ID",
        name: "String",
        age: "Int"
      });
      assert.equal(callback.mock.calls[3][1], "father");
      assert.equal(callback.mock.calls[3][2].name, "Person");
      assert.deepEqual(callback.mock.calls[3][3], {
        isScalar: false,
        isList: false,
        isNonNull: false,
        isObject: true
      });
    });
    it("expected arguments for list reference", () => {
      assert.deepEqual(callback.mock.calls[4][0], {
        id: "ID",
        name: "String",
        age: "Int",
        father: "Person"
      });
      assert.equal(callback.mock.calls[4][1], "products");
      assert.equal(callback.mock.calls[4][2].name, "Product");
      assert.deepEqual(callback.mock.calls[4][3], {
        isScalar: false,
        isList: true,
        isNonNull: false,
        isObject: true
      });
    });
  });
});
