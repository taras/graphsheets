import * as jest from "jest-mock";
import * as assert from "power-assert";

import createRecordResolver from "../../lib/resolvers/create";
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
  describe("payload", () => {
    let resolver, spreadsheet;
    beforeEach(() => {
      let id = 1;
      spreadsheet = {
        newId: jest.fn(() => {
          return `${id++}`;
        })
      };
      let typeMap = schema.getTypeMap();
      resolver = createRecordResolver(
        spreadsheet,
        getType(typeMap, "Person") as GraphQLObjectType,
        getMutation(typeMap, "createPerson")
      );
    });
    describe("id", () => {
      it("adds id to top entry hash", async () => {
        assert.deepEqual(await resolver({}, { person: {} }, {}), {
          person: { id: "1" }
        });
      });
      it("leaves id as is when present", async () => {
        assert.deepEqual(await resolver({}, { person: { id: "peter" } }, {}), {
          person: { id: "peter" }
        });
      });
      it("adds ids to single ferences", async () => {
        assert.deepEqual(
          await resolver(
            {},
            {
              person: { father: {} }
            },
            {}
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
          await resolver(
            {},
            {
              person: {
                products: [{}, {}]
              }
            },
            {}
          ),
          {
            person: {
              id: "1",
              products: [{ id: "2" }, { id: "3" }]
            }
          }
        );
      });
    });
    describe("scalar properties", () => {
      describe("from input properites", () => {
        it("maintains scalars", async () => {
          assert.deepEqual(
            await resolver(
              {},
              {
                person: {
                  name: "peter griffin"
                }
              },
              {}
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
            await resolver(
              {},
              {
                person: {
                  products: [{ title: "shoes" }],
                  father: {
                    name: "peter griffin"
                  }
                }
              },
              {}
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
});
