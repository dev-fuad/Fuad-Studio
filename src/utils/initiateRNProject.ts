import * as vscode from 'vscode';

import TerminalWrapper from './dbux/_DBux_ TerminalWrapper';
import { getNormalisedPath } from './getPath';
import getNodeVersion from './getNodeVersion';

type Params = {
  name: string;
  path: string;
  useExpo: boolean;
  skipInstall: boolean;
};

const initiateRNProject = async ({ name, path, useExpo, skipInstall }: Params) => {
  
  // Get project name
  // const name = await vscode.window.showInputBox({ title: 'Project Name' });
  let skipInstallCommand = skipInstall ? '--skip-install' : '';

  let command = `npx --yes react-native init ${name} ${skipInstallCommand} --directory ${path}/${name}`;
  if (useExpo) {
    let skipInstallCommand = skipInstall ? '--no-install' : '';
    command = `npx create-expo-app ${path}/${name} ${skipInstallCommand} --yes`;
  } else {
    const nodeVersion = await getNodeVersion();
    let prependCommand = 'NODE_OPTIONS=--openssl-legacy-provider';

    if (!!nodeVersion.match(/1[6-8].{?}*/)) {
      console.log(nodeVersion);
      command = `${prependCommand} ${command}`;
    }  
  }

  // Display a message box to the user
  vscode.window.showInformationMessage(`Creating a new react-native project at ${path}`);

  const { code } = await TerminalWrapper.execInTerminal(".", command, {}).waitForResult();
  if (code) {
    const processExecMsg = `.$ ${command}`;
    throw new Error(`Process failed with exit code ${code} (${processExecMsg})`);
  }

  try {
    const normPath = await getNormalisedPath(`${path}/${name}`);
    
    const uri = vscode.Uri.file(normPath);
    await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false });
  } catch (error) {
    console.log(error);
  }
};

export default initiateRNProject;
