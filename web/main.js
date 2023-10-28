//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  const form = document.forms['create-project-form'];
  const submitButton = document.getElementById('submit');
  const browseButton = document.getElementById('browse');


  submitButton?.addEventListener('click', (e) => {
    e.preventDefault();
    const name = form['name'].value;
    const path = form['path'].value;
    const useExpo = form['cli'].value === 'expo';
    const skipInstall = form['skipInstall'].checked;
    const useTemplate = form['useTemplate'].checked;

    const nameError = document.getElementById('name-error');
    if (name === '') {
      nameError?.classList.add('show');
      return;
    }
    nameError?.classList.remove('show');

    vscode.postMessage({
      command: 'create',
      text: JSON.stringify({
        name, path, useExpo, skipInstall, useTemplate
      }),
    });
  });

  browseButton?.addEventListener('click', (e) => {
    e.preventDefault();
    const path = form['path'].value;

    vscode.postMessage({
      command: 'browse',
      text: path
    });
  });

  form['useTemplate'].addEventListener('change', function () {
    const selectTemplate = document.getElementById('selectTemplate');
    if (this.checked) {
      selectTemplate?.classList.remove('hide');
    } else {
      selectTemplate?.classList.add('hide');
    }
  });

  window.addEventListener('message', (e) => {
    switch (e.data.type) {
      case 'browsedPath':
        form['path'].value = e.data.path;
        break;

      default:
        console.log('Unknown type', e);
        break;
    }
  });

}());
