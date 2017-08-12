export interface Authorizer {
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

export interface FetchHeadersResult {
  [name: string]: string[];
}

export interface SheetHeader {
  title: string;
  note?: string;
}

export interface GenericPayload {
  [name: string]: any;
}

export type Relationship = [string, string, string, string, string];
