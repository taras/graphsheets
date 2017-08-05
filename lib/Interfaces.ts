export interface IAuthorizer {
  /**
   * Use to check if this authorizer has credentials
   * to make requests to the service
   */
  isAuthorized: boolean;

  /**
   * Return new payload with authorization credentials
   * added to the request.
   */
  authorizeRequest: (payload) => {};

  getAuthorizationHeader: () => string;
}

export interface IFetchHeadersResult {
  [name: string]: string[];
}

export interface ISheetHeader {
  title: string;
  note?: string;
}

export interface IGenericPayload {
  [name: string]: any;
}

export type IRelationship = [string, string, string, string, string];

export type IFlatPayload = [string, { [key: string]: any }];

export type IRelationshipTransformCallback = (
  type: string,
  id: string,
  fieldName: string,
  targetType: string
) => any;
