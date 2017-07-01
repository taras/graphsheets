const logGenerator: (namespace: string) => HeimdallLoggerInterface = require('heimdalljs-logger');

interface HeimdallLoggerInterface {
  trace: (...args) => void
  debug: (...args) => void
  info: (...args) => void
  warn: (...args) => void
  error: (...args) => void
}

export default class Logger {

  private logger: HeimdallLoggerInterface;

  constructor(verbose) {
    this.logger = logGenerator('sheetsql'); 
  }

  trace(msg, ...args) {
    return this.logger.trace(msg, ...args);
  }

  debug(msg, ...args) {
    return this.logger.debug(msg, ...args);
  }

  info(msg, ...args) {
    return this.logger.info(msg, ...args);
  }

  warn(msg, ...args) {
    return this.logger.warn(msg, ...args);
  }

  error(msg, ...args) {
    return this.logger.error(msg, ...args);
  }
}