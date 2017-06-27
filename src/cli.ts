import Logger from './adapters/logger';
import authorize from './commands/authorize';
import path = require('path');

const {
  assign
} = Object;

export interface CLIOptions {
  version: string
  argv: string[]
  cwd: string
}

export default function(options: CLIOptions) {
  let { cwd } = options;

  async function catchDebug(callback: () => {}) {
    try {
      await callback();
    } catch (e) {
      console.error(e.message);
      console.error(e.stack);
    }
  }
  
  require('yargs')
    .command('authorize', 'fetch a token to access Google services', yargs => {
      yargs.option('read-only', {
        describe: 'gain read only access to Google Sheets',
        default: false,
        alias: 'r'
      });
      yargs.option('token-path', {
        describe: 'path where your token will be saved',
        default: path.join(process.env.HOME, '.credentials', 'sheets.googleapis.com-sheetsql.json'),
        alias: 't'
      });
      yargs.option('client-secret-path', {
        describe: 'path where client_secret.json is located',
        default: path.join(cwd, 'client_secret.json'),
        alias: 'c'
      });
    }, (argv) => {
      let {
        readOnly,
        tokenPath,
        clientSecretPath,
        verbose
      } = argv;

      let config = assign({
        readOnly,
        tokenPath,
        clientSecretPath
      }, options);

      catchDebug(() => authorize(config));
    })
    .option('verbose', {
      alias: 'v',
      default: false
    })
    .help()
    .argv;

}