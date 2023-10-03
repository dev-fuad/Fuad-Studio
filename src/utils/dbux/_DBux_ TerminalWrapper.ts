import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Terminal, window } from 'vscode';
import { getNodePath, getPath, getShellPath } from '../getPath';
import { closeDefaultTerminal, runInTerminal, runInTerminalInteractive } from './terminalUtil';

// const VERBOSE = true;
const VERBOSE = false;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = console;


// ###########################################################################
// TerminalWrapper
// ###########################################################################

export default class TerminalWrapper {
  _disposable: any;
  _promise: Promise<any> | null = null;
  _terminal: Terminal | null = null;

  start(cwd: string, command: Array<string> | string, options: any) {
    // this._disposable = window.onDidCloseTerminal(terminal => {
    //   if (terminal === this._terminal) {
    //     this.dispose();
    //   }
    // });
    if (Array.isArray(command)) {
      this._promise = this._runAll(cwd, command, options);
    }
    else {
      this._promise = this._run(cwd, command, options);
    }
  }

  async waitForResult() {
    return this._promise;
  }

  async _runAll(cwd: string, cmds: string[], options: any) {
    const res = [];
    closeDefaultTerminal();
    for (const command of cmds) {
      res.push(await this._run(cwd, command, options, true));
    }
    return res;
  }

  async _run(cwd: string, command: string, options: any, isInteractive = true) {
    let tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'dbux-'));

    const pathToNode = getNodePath();
    const shell = getShellPath();
    const pathToDbuxRun = getPath('src/utils/dbux/_DBux_Run.js');

    // serialize all arguments for dbux_run.js
    const runJsargs = { 
      cwd, 
      command, 
      options,
      tmpFolder,
      shell
    };
    const serializedRunJsArgs = Buffer.from(JSON.stringify(runJsargs)).toString('base64');
    // const runJsCommand = `pwd && node -v && which node && echo %PATH% && node ${pathToDbuxRun} ${serializedRunJsArgs}`;
    const runJsCommand = `"${pathToNode}" "${pathToDbuxRun}" ${(!isInteractive ? 0 : 1)} ${serializedRunJsArgs}`;

    debug('wrapping terminal command: ', JSON.stringify(runJsargs), `pathToDbuxRun: ${pathToDbuxRun}`);

    // execute command

    const commandCall = `${cwd}$ ${command}`;

    let _resolve: any, _reject: any, _promise = new Promise((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });

    let resolved = false;
    const watcher = fs.watch(tmpFolder);
    watcher.on('change', (eventType, filename) => {
      watcher.close();
      this.dispose();

      let result;
      if (filename === 'error') {
        let errorString = fs.readFileSync(path.join(tmpFolder, filename), { encoding: 'utf8' });
        let error = JSON.parse(errorString);
        _reject(new Error(`Terminal wrapper received error: ${error?.stack || JSON.stringify(error)}`));
      } else {
        result = { code: parseInt(filename as string, 10) };
        VERBOSE && debug('Terminal command finished. Result:', JSON.stringify(result));
        _resolve(result);
        resolved = true;
      }

      fs.unlinkSync(path.join(tmpFolder, filename as string));
    });

    watcher.on('error', (err) => {
      let newErr = new Error(`[FSWatcher error while waiting for TerminalWrapper]: ` + err);
      if (resolved) {
        warn(newErr);
      }
      else {
        _reject(newErr);
      }
    });

    window.onDidCloseTerminal((terminal) => {
      if (terminal === this._terminal) {
        watcher.close();
        this.dispose();

        const msg = `Terminal closed (${commandCall})`;
        if (resolved) {
          debug(msg);
        }
        else {
          let newErr = new Error(msg);
          _reject(newErr);
        }
      }
    });

    try {
      // Go!
      const execFn = isInteractive ? runInTerminalInteractive : runInTerminal;
      this._terminal = await execFn(cwd, runJsCommand);

      return await _promise;
    }
    catch (err: any) {
      // await sleep(5);
      // this.dispose();
      err.message = `Terminal command failed: ${err.message}\n\n  command $ ${commandCall}`;
      throw err;
    } finally {
      // this.dispose();
      try {
        fs.rmSync(tmpFolder, { force: true, recursive: true });
      }
      catch (err: any) {
        debug(`(unable to remove temp folder "${tmpFolder}" - ${err.message})`);
      }
    }
  }

  dispose() {
    const {
      _disposable
    } = this;

    this._disposable = null;
    this._promise = null;
    this._terminal = null;

    _disposable?.dispose();
  }

  cancel() {
    this.dispose();
  }


  // ###########################################################################
  // static functions
  // ###########################################################################

  /**
   * Execute `command` in `cwd` in terminal.
   * @param {string} cwd Set working directory to run `command`.
   * @param {string} command The command will be executed.
   * @param {object} options 
   */
  static execInTerminal(cwd: string, command: string | Array<string>, options: any) {
    // TODO: register wrapper with context

    const wrapper = new TerminalWrapper();
    wrapper.start(cwd, command, options);
    return wrapper;
  }
}