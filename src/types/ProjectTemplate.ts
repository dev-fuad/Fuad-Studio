type ProjectTemplate = {
  [key: string]: string | Array<any> | ProjectTemplate;
};

export default ProjectTemplate;
