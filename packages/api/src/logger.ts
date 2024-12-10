import debug from 'debug';

export class Logger {
  private readonly _log: debug.Debugger;
  private readonly _info: debug.Debugger;
  private readonly _warn: debug.Debugger;
  private readonly _error: debug.Debugger;

  constructor(name: string) {
    this._log = debug(name);
    this._info = debug(`${name}:info`);
    this._warn = debug(`${name}:warn`);
    this._error = debug(`${name}:error`);
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
}
