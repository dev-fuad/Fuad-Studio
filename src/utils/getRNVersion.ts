import { exec } from "child_process";

const getRNVersion = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec('npm view react-native dist-tags.latest', (error, stdout) => {
      if (stdout) {
        return resolve(stdout);
      }
      return reject(error);
    });
  });
};

export default getRNVersion;
