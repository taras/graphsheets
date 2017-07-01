import GoogleAuthorizer from "../google-auth";

export default function authorizeHandler(handler) {
  return function(argv) {
    let { tokenPath, clientSecretPath, title } = argv;

    let authorizer = GoogleAuthorizer.restore(clientSecretPath, tokenPath);

    if (authorizer.isAuthorized) {
      return handler(argv, authorizer);
    } else {
      console.error(`Command failed because you're not authorized.`);
    }
  };
}
