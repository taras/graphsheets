import { filterObject } from "./object-utils";
import { GraphQLObjectType } from "graphql";

export type ObjectTypeMap = { [typeName: string]: GraphQLObjectType };

export default function onlyObjectTypes(typesMap): ObjectTypeMap {
  return filterObject(
    typesMap,
    (name, type) =>
      type instanceof GraphQLObjectType &&
      name.indexOf("__") === -1 &&
      ["Query", "Mutation"].indexOf(name) === -1
  );
}
