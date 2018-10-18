/* eslint-env node */

let shell = require('shelljs');

function mergePotFiles(file, outputFile, options) {
  let mergeOpts = [
    `--lang=${options.defaultLanguage}`,
    `--output-file=${outputFile}`,
    `--to-code=${options.fromCode.toLowerCase()}`,
    `--use-first`,
    `--no-wrap`,
    outputFile,
    file
  ];

  let mergeArgs = mergeOpts.join(' ');
  shell.exec(`msgcat ${mergeArgs}`);
}

module.exports = {
  mergePotFiles
};
