// jscs:disable
/* jshint node:true */

'use strict';

var chalk = require('chalk');
var shell = require('shelljs');

module.exports = function createJsonFromPo(options, ui) {
  let languagePoFile = `${options.outputDirectory}/${options.language}.po`;
  let languageJsonFile = `${options.jsonDirectory}/${options.language}.json`;
  shell.mkdir('-p', options.jsonDirectory);
  shell.exec(`touch ${languageJsonFile}`);

  ui.writeLine(chalk.green(`Converting ${languagePoFile} to ${languageJsonFile} ...`));

  let opts = [
    languagePoFile,
    languageJsonFile,
    `-p`
  ];
  shell.exec(`node ${options.gettextjsPath} ${opts.join(' ')}`);
};
