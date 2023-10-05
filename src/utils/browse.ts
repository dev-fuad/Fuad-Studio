import * as vscode from 'vscode';

const onBrowse = (view: vscode.WebviewView) => {
  const options: vscode.OpenDialogOptions = {
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
    openLabel: 'Select',
    title: 'Select the folder to create your project in'
  };

  vscode.window.showOpenDialog(options)
    .then((uri) => {
      if (!uri || uri.length <= 0) {
        return;
      }

      view.webview.postMessage({ type: 'browsedPath', path: uri[0].fsPath });
    });
};

export default onBrowse;
