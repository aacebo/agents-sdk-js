import debug from 'debug';

export class Logger {
  readonly name: string;
  private readonly _log: debug.Debugger;
  private readonly _info: debug.Debugger;
  private readonly _warn: debug.Debugger;
  private readonly _error: debug.Debugger;
  private readonly _debug: debug.Debugger;

  constructor(name: string) {
    this.name = name;
    this._log = debug(name);
    this._info = debug(`${name}:info`);
    this._warn = debug(`${name}:warn`);
    this._error = debug(`${name}:error`);
    this._debug = debug(`${name}:debug`);
  }

  log(formatter: any, ...args: any[]) {
    this._log(formatter, ...args);
  }

  info(formatter: any, ...args: any[]) {
    this._info(formatter, ...args);
  }

  warn(formatter: any, ...args: any[]) {
    this._warn(formatter, ...args);
  }

  error(formatter: any, ...args: any[]) {
    this._error(formatter, ...args);
  }

  debug(formatter: any, ...args: any[]) {
    this._debug(formatter, ...args);
  }

  fork(name: string) {
    return new Logger(`${this.name}:${name}`);
  }
}
