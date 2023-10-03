import * as vscode from 'vscode';

export default class ExtensionContext {
  private static _instance: ExtensionContext;

  static context: vscode.ExtensionContext;

  private constructor() {}

  // eslint-disable-next-line @typescript-eslint/naming-convention
  public static Instance(context: vscode.ExtensionContext) {
    if (this._instance) { return this._instance; }

    this.context = context;
    return (this._instance = new this());
  }
}
