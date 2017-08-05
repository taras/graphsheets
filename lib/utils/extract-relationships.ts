import { IGenericPayload, IRelationship } from "../Interfaces";
import { GraphQLField, GraphQLObjectType } from "graphql";
import { reduceMutationArguments, reduceType } from "./type-map-utils";
import * as has from "lodash/fp/has";
import * as get from "lodash/fp/get";

export default function extractRelationships(
  mutation: GraphQLField<string, any>,
  payload: IGenericPayload
): Array<IRelationship> {
  let { type } = mutation;
  return reduceMutationArguments(
    mutation,
    (result, argName: string) => {
      let root = get(argName, payload);
      let output = type as GraphQLObjectType;

      return [...result, ...typeTraverser(output, root)];
    },
    []
  );
}

function typeTraverser(output: GraphQLObjectType, root): Array<IRelationship> {
  return reduceType(
    output,
    (
      result,
      fieldName: string,
      type: GraphQLObjectType,
      { isList, isObject }
    ) => {
      if (isList && has(fieldName, root)) {
        return [
          ...result,
          ...get(fieldName, root).reduce((result, item) => {
            return [
              ...result,
              [output.name, root.id, fieldName, type.name, item.id],
              ...typeTraverser(type, item)
            ];
          }, [])
        ];
      }
      if (isObject && has(fieldName, root)) {
        return [
          ...result,
          [
            output.name,
            root.id,
            fieldName,
            type.name,
            get(`${fieldName}.id`, root)
          ],
          ...typeTraverser(type, get(fieldName, root))
        ];
      }
      return result;
    },
    []
  );
}
