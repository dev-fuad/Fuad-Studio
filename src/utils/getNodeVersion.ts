import { exec } from "child_process";

const getNodeVersion = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec('node -v', (error, stdout) => {
      if (stdout) {
        return resolve(stdout);
      }
      return reject(error);
    });
  });
};

export default getNodeVersion;
