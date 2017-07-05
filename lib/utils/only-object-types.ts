import { filterObject } from "./object-utils";
import { GraphQLObjectType } from "graphql";

export default function onlyObjectTypes(typesMap) {
  return filterObject(
    typesMap,
    (name, type) =>
      type instanceof GraphQLObjectType &&
      name.indexOf("__") === -1 &&
      ["Query", "Mutation"].indexOf(name) === -1
  );
}
