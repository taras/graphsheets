import { GraphQLField, GraphQLObjectType, GraphQLNamedType } from "graphql";
import {
  IGenericPayload,
  IFlatPayload,
  IRelationshipTransformCallback
} from "../Interfaces";
import {
  buildObjectTypeParams,
  reduceMutationArguments,
  reduceType
} from "./type-map-utils";
import * as get from "lodash/fp/get";
import * as has from "lodash/fp/has";

const { isArray } = Array;

export default function flattenPayload(
  mutation: GraphQLField<string, any>,
  transform: IRelationshipTransformCallback,
  payload: IGenericPayload
): Array<IFlatPayload> {
  return reduceMutationArguments(
    mutation,
    (result: Array<IFlatPayload>, argName: string) => {
      let root = payload[argName];
      let output = mutation.type as GraphQLObjectType;
      let { isList, isObject } = buildObjectTypeParams(output);

      if (isObject) {
        return [...result, ...flattenReference(output, root)];
      }
    },
    []
  );

  function flattenReference(output, root) {
    return reduceType(
      output,
      (
        result,
        fieldName: string,
        type: GraphQLNamedType,
        { isScalar, isList, isObject }
      ) => {
        let value = root[fieldName];
        if (isObject && has(fieldName, root)) {
          if (isList) {
            if (isArray(value)) {
              return [
                ...result,
                ...value.reduce(
                  (result, item) => [
                    ...result,
                    ...flattenReference(type, item)
                  ],
                  []
                )
              ];
            } else {
              return result;
            }
          } else {
            return [...result, ...flattenReference(type, value)];
          }
        }
        return result;
      },
      [
        [
          output.name,
          reduceType(
            output,
            (
              result,
              fieldName: string,
              type: GraphQLNamedType,
              { isList, isObject }
            ) => {
              if (isObject) {
                return {
                  ...result,
                  [fieldName]: transform(
                    output.name,
                    root.id,
                    fieldName,
                    type.name
                  )
                };
              }
              if (has(fieldName, root)) {
                return {
                  ...result,
                  [fieldName]: get(fieldName, root)
                };
              } else {
                return result;
              }
            }
          )
        ]
      ]
    );
  }
}
