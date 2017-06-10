'use strict'

const log4js  = require('log4js')
const sprintf = require('sprintf-js').sprintf

class Logger {

  constructor(){}

  configure(config) {
    log4js.configure(config)
    Logger.default = log4js.getLogger('sideshow')
  }

  trace(template, ...arg) {
    const msg = (arg.length > 0) ? sprintf(template, ...arg) : template
    Logger.default.trace(msg)
  }

  debug(template, ...arg) {
    const msg = (arg.length > 0) ? sprintf(template, ...arg) : template
    Logger.default.debug(msg)
  }

  info(template, ...arg) {
    const msg = (arg.length > 0) ? sprintf(template, ...arg) : template
    Logger.default.info(msg)
  }

  warn(template, ...arg) {
    const msg = (arg.length > 0) ? sprintf(template, ...arg) : template
    Logger.default.warn(msg)
  }

  error(template, ...arg) {
    const msg = (arg.length > 0) ? sprintf(template, ...arg) : template
    Logger.default.error(msg)
  }

  fatal(template, ...arg) {
    const msg = (arg.length > 0) ? sprintf(template, ...arg) : template
    Logger.default.fatal(msg)
  }

  dumpError(template, error) {
    let reason = ""
    if (error !== null) {
      if (error instanceof Error) {
        reason = (error.stack !== null) ? error.stack : error.message
      } else {
        reason = error.toString()
      }
    }
    this.error(template, reason)
  }

}

Logger.default = null

module.exports = new Logger()
