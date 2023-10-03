//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  const form = document.forms['create-project-form'];
  const submitButton = document.getElementById('submit');

  submitButton?.addEventListener('click', (e) => {
    e.preventDefault();
    const name = form['name'].value;
    const path = form['path'].value;
    const useExpo = form['cli'].value === 'expo';
    const skipInstall = form['skipInstall'].checked;

    const nameError = document.getElementById('name-error');
    if (name === '') {
      nameError?.classList.add('show');
      return;
    }
    nameError?.classList.remove('show');

    vscode.postMessage({
      command: 'create',
      text: JSON.stringify({
        name, path, useExpo, skipInstall
      }),
    });
  });

}());
