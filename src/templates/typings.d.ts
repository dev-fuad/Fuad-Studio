import ProjectTemplate from "../types/ProjectTemplate";

declare module "*.json" {
  const value: ProjectTemplate;
  export default value;
}