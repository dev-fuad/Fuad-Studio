//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  const newButton = document.getElementById('new');
  const cleanButton = document.getElementById('clean');
  const runButton = document.getElementById('run');

  newButton?.addEventListener('click', (e) => {
    e.preventDefault();
    vscode.postMessage({ command: 'new' });
  });
}());
