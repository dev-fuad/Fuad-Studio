import * as vscode from 'vscode';
import onBrowse from './utils/browse';
import initiateRNProject from './utils/initiateRNProject';

export default class NewProjectProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'fuadStudio-newProject';

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
  ) { }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this._view = webviewView;

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
        <h2>New Project</h2>

        <br />
    
        <form name="create-project-form">
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

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
