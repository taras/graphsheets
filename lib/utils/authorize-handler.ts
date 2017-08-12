import GoogleAuthorizer from "../google-auth";
import GoogleClientConfig from "../models/google-client-config";

export default function authorizeHandler(handler) {
  return function(argv) {
    let { tokenPath, clientSecretPath, title } = argv;

    let googleClientConfig = GoogleClientConfig.initFromFiles(
      clientSecretPath,
      tokenPath
    );
    let authorizer = GoogleAuthorizer.restore(googleClientConfig);

    if (authorizer.isAuthorized) {
      return handler(argv, authorizer);
    } else {
      console.error(`Command failed because you're not authorized.`);
    }
  };
}
