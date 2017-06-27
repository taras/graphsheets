import Logger from './adapters/logger';
import authorize from './commands/authorize';
import path = require('path');

const {
  assign
} = Object;

require('yargs')
  .command(authorize)
  .option('verbose', {
    alias: 'v',
    default: false
  })
  .help()
  .argv;