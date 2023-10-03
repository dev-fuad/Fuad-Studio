import { TerminalOptions, window } from 'vscode';
import { getShellPath } from '../getPath';
import sleep from '../sleep';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = console;

const DEFAULT_TERMINAL_NAME = 'Fuad\'s Studio';

export function createDefaultTerminal(cwd: string) {
  return createTerminal(DEFAULT_TERMINAL_NAME, cwd);
}

export function recreateTerminal(terminalOptions: TerminalOptions) {
  closeTerminal(terminalOptions.name ?? '');
  return window.createTerminal(terminalOptions);
}

export function createTerminal(name: string, cwd: string) {

  closeTerminal(name);

  const terminalOptions = {
    name,
    cwd
  };
  return window.createTerminal(terminalOptions);
}

export function sendCommandToDefaultTerminal(cwd: string, command: string) {
  const terminal = createDefaultTerminal(cwd);

  terminal.sendText(command, true);
  terminal.show(false);

  return terminal;
}

export function findTerminal(name: string) {
  return window.terminals.find(t => t.name === name);
}

export function closeDefaultTerminal() {
  closeTerminal(DEFAULT_TERMINAL_NAME);
}

export function closeTerminal(name: string) {
  let terminal = findTerminal(name);
  terminal?.dispose();
}

// function bashParse(string) {
//   return string.replace(/"/g, `\\"`).replace(/`/g, "\\`");
// }


/**
 * @see https://github.com/microsoft/vscode-extension-samples/blob/master/terminal-sample/src/extension.ts#L177
 */
export function selectTerminal() {
  const { terminals } = window;
  const items = terminals.map(t => {
    return {
      label: `name: ${t.name}`,
      terminal: t
    };
  });
  return window.showQuickPick(items).then(item => {
    return item ? item.terminal : undefined;
  });
}

/**
 * 
 * 
 * @see https://github.com/microsoft/vscode-extension-samples/blob/master/terminal-sample/src/extension.ts#L105
 */
export async function queryTerminalPid() {
  const terminal = await selectTerminal();
  if (!terminal) {
    return null;
  }

  return terminal.processId; // NOTE: processId returns a promise!
}

export function getOrCreateTerminal(terminalOptions: TerminalOptions) {
  const { name } = terminalOptions;
  let terminal = findTerminal(name ?? '');
  if (!terminal || !!terminal.exitStatus) {
    terminal = recreateTerminal(terminalOptions);
  }
  return terminal;
}


/** ###########################################################################
 * {@link runInTerminal}
 * ##########################################################################*/

export async function runInTerminal(cwd: string, command: string) {

  const name = DEFAULT_TERMINAL_NAME;
  closeTerminal(name);

  // const shellPath = whichNormalized(getShellPath());
  const shellPath = getShellPath();
  // const shellName = getShellName();
  // const inlineFlags = getShellInlineFlags();
  // const pause = getShellPauseCommand();
  // const sep = getShellSep();

  // WARNING: terminal is not properly initialized when running the command. cwd is not set when executing `command`.
  const wrappedCommand = `cd "${cwd}" && ${command}`;
  // const wrappedCommand = await window.showInputBox({ 
  //   placeHolder: 'input a command',
  //   value: '/k echo hello world!'
  // });

  let shellArgs;
  shellArgs = [wrappedCommand];

  /**
   * @see https://code.visualstudio.com/api/references/vscode-api#TerminalOptions
   */
  const terminalOptions = {
    name: DEFAULT_TERMINAL_NAME,
    cwd,
    shellPath: shellPath,
    shellArgs,
  };

  // debug(`[execCommandInTerminal] ${cwd}$ ${command}`);

  const terminal = window.createTerminal(terminalOptions);
  terminal.show();

  // terminal.sendText(wrappedCommand);

  return terminal;
}

/** ###########################################################################
 * {@link runInTerminalInteractive}
 * ##########################################################################*/

export async function runInTerminalInteractive(cwd: string, command: string, createNew = false) {
  if (!command) {
    throw new Error('command for runInTerminalInteractive is empty: ' + command);
  }
  const terminalName = DEFAULT_TERMINAL_NAME;

  // const shellPath = whichNormalized(getShellPath());
  const shellPath = await getShellPath();

  const terminalOptions = {
    name: terminalName,
    cwd,
    shellPath: shellPath
  };

  // hackfix: when running multiple commands in serial, subsequent terminal access might fail, if too fast
  await sleep(300);

  const terminal = createNew ?
    recreateTerminal(terminalOptions) :
    getOrCreateTerminal(terminalOptions);

  // hackfix: sometimes, the terminal needs a tick before it can receive text
  await sleep(1);

  terminal.sendText(command, true);
  terminal.show(false);

  return terminal;
}
