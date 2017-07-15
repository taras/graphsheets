import * as jest from "jest-mock";
import * as assert from "power-assert";

import createRecordResolver, {
  injectIds,
  extractRelationships
} from "../../lib/resolvers/create";
import { buildSchemaFromTypeDefinitions } from "graphql-tools/dist";
import { getType, getMutation } from "../../lib/utils/type-map-utils";
import { GraphQLObjectType } from "graphql";

describe("resolvers/create", () => {
  let schema = buildSchemaFromTypeDefinitions(`
    type Person {
      id: ID!
      name: String
      products: [Product]
      father: Person
      favourite: Product
    }

    type Product {
      id: ID!
      title: String
      alternative: Product
      owner: Person
    }

    type Query {
      persons: [Person]
    }

    input ProductInput {
      id: ID
      title: String
      owner: PersonInput
    }

    input PersonInput {
      id: ID
      products: [ProductInput]
      name: String
      father: PersonInput
      favourite: ProductInput
    }

    type Mutation {
      createPerson(person: PersonInput): Person
    }
  `);
  let typeMap = schema.getTypeMap();
  let mutation = getMutation(typeMap, "createPerson");
  describe("injectId", () => {
    let resolver, spreadsheet, actions;
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
    it("adds ids to single ferences", async () => {
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
  describe("extractRelationships", () => {
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
});
