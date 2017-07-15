import {
  GraphQLFieldMap,
  GraphQLField,
  GraphQLNamedType,
  GraphQLObjectType,
  isCompositeType,
  getNamedType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLCompositeType,
  GraphQLFieldConfigMap,
  GraphQLFieldConfig,
  GraphQLType,
  GraphQLSchema,
  GraphQLArgument,
  GraphQLInputType,
  GraphQLInputField,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLInputObjectType
} from "graphql";
import { reduceObject, filterObject } from "./object-utils";
import { default as onlyObjectTypes, ObjectTypeMap } from "./only-object-types";

export type FieldInfo = {
  isList: boolean;
  isNonNull: boolean;
};

export type ReduceTypeMapCallback = (
  result: any,
  type: GraphQLNamedType,
  field: GraphQLField<string, GraphQLCompositeType>,
  reference: GraphQLNamedType,
  fieldInfo: FieldInfo
) => any;

export type TypeMap = {
  [typeName: string]: GraphQLNamedType;
  Query?: GraphQLObjectType;
  Mutation?: GraphQLObjectType;
};

export function reduceTypeMap(
  typeMap: TypeMap,
  cb: ReduceTypeMapCallback,
  result = {}
) {
  return reduceObject(
    onlyObjectTypes(typeMap),
    (result, typeName: string, type: GraphQLObjectType) => {
      let fields = type.getFields();
      return reduceObject(
        onlyComposite(fields),
        (
          result,
          fieldName: string,
          fieldInfo: GraphQLField<string, GraphQLCompositeType>
        ) => {
          let isNonNull = fieldInfo.type instanceof GraphQLNonNull;
          let isList = fieldInfo.type instanceof GraphQLList;
          return cb(result, type, fieldInfo, getNamedType(fieldInfo.type), {
            isNonNull,
            isList
          });
        },
        result
      );
    },
    result
  );
}

/**
 * Return a type map typed as local TypeMap.
 */
export function getTypeMap(schema: GraphQLSchema): TypeMap {
  return schema.getTypeMap();
}

/**
 * reduceMutation traverses a mutation and invokes a callback
 * for every property of each argument. It will return a single
 * value that's returned from the last invokation of the callback.
 */
export function reduceMutationArguments(
  mutation: GraphQLField<string, any>,
  callback: (
    result: any,
    name: string,
    type: GraphQLNamedType,
    info: InputTypeInfo
  ) => any,
  initial = {}
) {
  return mutation.args.reduce((result, arg: GraphQLArgument) => {
    let { name, type } = arg;
    return callback(
      result,
      name,
      getFieldType(arg),
      buildInputTypeParams(type)
    );
  }, initial);
}

export type ObjectTypeInfo = {
  isScalar: boolean;
  isList: boolean;
  isNonNull: boolean;
  isObject: boolean;
};

export type ReduceTypeCallback = (
  result: any,
  fieldName: string,
  type: GraphQLNamedType,
  info: ObjectTypeInfo
) => any;

export function reduceType(
  type: GraphQLObjectType,
  callback: ReduceTypeCallback,
  initial = {}
) {
  return reduceObject(
    type.getFields(),
    (result, fieldName: string, field: GraphQLField<string, any>) => {
      return callback(
        result,
        fieldName,
        getFieldType(field),
        buildObjectTypeParams(field.type)
      );
    },
    initial
  );
}

export function buildObjectTypeParams(type): ObjectTypeInfo {
  return {
    ...buildCommonTypeParams(type),
    get isObject() {
      if (type instanceof GraphQLList || type instanceof GraphQLNonNull) {
        return getNamedType(type) instanceof GraphQLObjectType;
      } else {
        return type instanceof GraphQLObjectType;
      }
    }
  };
}

export type InputTypeInfo = {
  isScalar: boolean;
  isList: boolean;
  isNonNull: boolean;
  isInput: boolean;
};

export function buildInputTypeParams(type: GraphQLInputType): InputTypeInfo {
  return {
    ...buildCommonTypeParams(type),
    get isInput() {
      return getNamedType(type) instanceof GraphQLInputObjectType;
    }
  };
}

export function buildCommonTypeParams(
  type: GraphQLInputType | GraphQLObjectType
) {
  return {
    get isScalar() {
      if (type instanceof GraphQLList || type instanceof GraphQLNonNull) {
        return getNamedType(type) instanceof GraphQLScalarType;
      } else {
        return type instanceof GraphQLScalarType;
      }
    },
    get isList() {
      return type instanceof GraphQLList;
    },
    get isNonNull() {
      return type instanceof GraphQLNonNull;
    }
  };
}

export type reduceInputObjectTypeCallback = (
  result: any,
  name: string,
  field: GraphQLNamedType,
  info: InputTypeInfo
) => any;

export function reduceInputObjectType(
  type: GraphQLInputObjectType,
  callback: reduceInputObjectTypeCallback,
  initial = {}
) {
  let fields = type.getFields();
  return reduceObject(
    fields,
    (result: any, name: string, field: GraphQLInputField) => {
      return callback(
        result,
        name,
        getFieldType(field),
        buildInputTypeParams(field.type)
      );
    },
    initial
  );
}

export function getFieldType(
  field: GraphQLField<string, GraphQLCompositeType> | GraphQLArgument
): GraphQLNamedType {
  let { type } = field;
  if (type instanceof GraphQLNonNull || type instanceof GraphQLList) {
    return getNamedType(type);
  } else {
    return type;
  }
}

export function onlyComposite(
  fields: GraphQLFieldMap<any, any>
): GraphQLFieldMap<string, GraphQLCompositeType> {
  return filterObject(fields, (propName, field) => {
    return isCompositeType(getFieldType(field));
  });
}

export function isDefinedQuery(typeMap: TypeMap, name: string): boolean {
  let { Query } = typeMap;
  let fields = Query.getFields();
  return !!fields[name];
}

export function getType(typeMap: TypeMap, name: string): GraphQLNamedType {
  return typeMap[name];
}

export function isDefinedMutation(typeMap: TypeMap, name: string): boolean {
  return !!getMutation(typeMap, name);
}

export function getMutation(
  typeMap: TypeMap,
  name: string
): GraphQLField<string, any> {
  let { Mutation } = typeMap;
  if (Mutation) {
    let fields = Mutation.getFields();
    return fields[name];
  }
}
