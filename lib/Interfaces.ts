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
