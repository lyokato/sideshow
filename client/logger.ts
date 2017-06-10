export enum LogLevel {
  debug,
  info,
  warn,
  error
};

export class Logger {

  private static level: LogLevel = LogLevel.debug;

  static setLevel(level: LogLevel) {
    this.level = level;
  }

  static debug(msg: string) {
    if (this.level <= LogLevel.debug) {
      console.log("[DEBUG] " + msg);
    }
  }

  static info(msg: string) {
    if (this.level <= LogLevel.info) {
      console.log("[INFO] " + msg);
    }
  }

  static warn(msg: string) {
    if (this.level <= LogLevel.warn) {
      console.log("[WARN] " + msg);
    }
  }

  static error(msg: string) {
    if (this.level <= LogLevel.error) {
      console.log("[ERROR] " + msg);
    }
  }

}

export default Logger;
