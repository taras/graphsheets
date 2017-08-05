import { GraphQLField, GraphQLObjectType, GraphQLNamedType } from "graphql";
import { IGenericPayload, IFlatPayload } from "../Interfaces";
import {
  buildObjectTypeParams,
  reduceMutationArguments,
  reduceType
} from "./type-map-utils";
import * as get from "lodash/fp/get";
import * as has from "lodash/fp/has";

const { isArray } = Array;

export default function replaceFormulasAndFlatten(
  mutation: GraphQLField<string, any>,
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
}

export function flattenReference(output, root) {
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
                (result, item) => [...result, ...flattenReference(type, item)],
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
                [fieldName]: relationshipFormula(
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

export function relationshipFormula(
  from: string,
  id: string,
  on: string,
  to: string
) {
  return `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='${from}' AND C='${id}' AND D='${on}' and E='${to}'"))`;
}
