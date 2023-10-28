import { Uri, workspace } from 'vscode';
import ProjectTemplate from "../types/ProjectTemplate";

async function spitTemplate(template: ProjectTemplate, root: string) {
  for await (const name of Object.keys(template)) {
    const uri = Uri.parse(root);
    const filename = Uri.joinPath(uri, name);
    if (typeof template[name] === 'string') {
      const content = Uint8Array.from(
        (template[name] as string)
          .split("")
          .map(x => x.charCodeAt(0))
      );
      await workspace.fs.writeFile(filename, content);
    } else if (Array.isArray(template[name])) {
      const [contentString] = (template[name] as Array<any>);
      if (typeof contentString === 'string') {
        const content = Uint8Array.from(
          contentString
            .split("")
            .map(x => x.charCodeAt(0))
        );
        await workspace.fs.writeFile(filename, content);
      }
    } else if (typeof template[name] === 'object') {
      const uri = Uri.parse(root);
      const folderName = Uri.joinPath(uri, name);
      await workspace.fs.createDirectory(folderName);
      await spitTemplate(template[name] as ProjectTemplate, folderName.fsPath);
    }
  }
}

export default spitTemplate;
