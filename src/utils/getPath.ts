import * as vscode from 'vscode';
import ExtensionContext from "./ExtensionContext";
import TerminalWrapper from './dbux/_DBux_ TerminalWrapper';
import { exec } from 'child_process';

export const getPath = (relativePath: string): string => {
  return ExtensionContext.context.asAbsolutePath(relativePath);
};

export const getNormalisedPath = async (relativePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (relativePath.includes('~') || relativePath.includes('./')) {
      exec(`cd ${relativePath} && pwd`, (error, stdout) => {
        if (stdout) {
          return resolve(stdout.replace('\n', ''));
        }
        return reject(error);
      });
    } else {
      return resolve(relativePath);
    }
  });
};

export const getNodePath = (): string => {
  const settings = vscode.workspace.getConfiguration('fuad-rn');
  return settings.get('node') ?? 'node';
};

export const getShellPath = (): string => {
  const settings = vscode.workspace.getConfiguration('fuad-rn');
  return settings.get('shell') ?? '/bin/bash';
};
