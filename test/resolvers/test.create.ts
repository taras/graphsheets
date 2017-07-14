import * as jest from "jest-mock";
import * as assert from "power-assert";

import createRecordResolver, { injectIds } from "../../lib/resolvers/create";
import { buildSchemaFromTypeDefinitions } from "graphql-tools/dist";
import { getType, getMutation } from "../../lib/utils/type-map-utils";
import { GraphQLObjectType } from "graphql";

describe.only("resolvers/create", () => {
  let schema = buildSchemaFromTypeDefinitions(`
    type Person {
      id: ID!
      name: String
      products: [Product]
      father: Person
    }

    type Product {
      id: ID!
      title: String
    }

    type Query {
      persons: [Person]
    }

    input ProductInput {
      id: ID
      title: String
    }

    input PersonInput {
      id: ID
      products: [ProductInput]
      name: String
      father: PersonInput
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
});
