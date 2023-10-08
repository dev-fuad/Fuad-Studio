import * as vscode from 'vscode';
import ExtensionContext from './utils/ExtensionContext';
import onBrowse from './utils/browse';
import getNonce from './utils/getNonce';
import initiateRNProject from './utils/initiateRNProject';

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
  };
}

export default class NewProjectProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'fuadStudio-newProject';

  public static currentPanel: NewProjectProvider | undefined;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _panel: vscode.WebviewPanel | null,
  ) {
    if (!_panel) {
      return;
    }

    _panel.title = "Create Project";
    this.resolveWebviewView(_panel);
  }

  public static createOrShow() {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (NewProjectProvider.currentPanel?._panel) {
      NewProjectProvider.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      NewProjectProvider.viewType,
      'Create Project',
      column || vscode.ViewColumn.One,
      getWebviewOptions(ExtensionContext.context.extensionUri),
    );

    NewProjectProvider.currentPanel = new NewProjectProvider(ExtensionContext.context.extensionUri, panel);
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView | vscode.WebviewPanel
  ): void | Thenable<void> {

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [
        this._extensionUri
      ]
    };

    const settings = vscode.workspace.getConfiguration('fuad-rn');
    let path: string = settings.get('path') ?? '~';
    let framework: string = settings.get('framework') ?? '';

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, { path, framework });

    webviewView.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'create':
            initiateRNProject(JSON.parse(message.text));
            return;
          case 'browse':
            onBrowse(webviewView);
            return;
          default:
            console.log('Unknown command', message);
        }
      },
    );
  }

  private _getHtmlForWebview(webview: vscode.Webview, { path, framework }: { path: string, framework: string }) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'web', 'main.js'));

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'web', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'web', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'web', 'main.css'));

    const reactNativeCheck = framework === 'react-native' ? 'checked' : '';
    const expoCheck = framework === 'expo' ? 'checked' : '';

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Fuad's RN Studio</title>
			</head>
			<body>
        <form name="create-project-form">
        <h2>New Project</h2>

        <br />
    
          <input name="name" placeholder="Project Name" required />
          <span class="error" id="name-error">Please enter a valid name</span>
      
          <br />

          <span class="row">
            <label for="path">Path</label>
            <input readonly name="path" placeholder="Path"  value="${path}" />
            <button id="browse">Browse</button>
          </span>
      
          <br />
      
          <label>CLI</label>
          <span id="cli" class="radio-group">
            <span class="row">
              <input type="radio" name="cli" value="react-native" ${reactNativeCheck} />
              <label for="react-native">React Native</label>
            </span>
            <span class="row">
              <input type="radio" name="cli" value="expo" ${expoCheck} />
              <label for="expo">Expo</label>
            </span>
          </span>
      
          <br />
      
          <span class="row">
            <input type="checkbox" name="skipInstall" />
            <label for="skipInstall">Skip installing dependencies</label>
          </span>
      
          <br />
      
          <button id="submit" class="new-button">New Project</button>

        </form>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}
