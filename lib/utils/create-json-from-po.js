// jscs:disable
/* jshint node:true */

'use strict';

var chalk = require('chalk');
var shell = require('shelljs');

module.exports = function createJsonFromPo(options, ui) {
  let languagePoFile = `${options.outputDirectory}/${options.language}.po`;

  ui.writeLine(chalk.green(`Converting ${languagePoFile} to ${options.jsonDirectory}/${options.language}.json ...`));

  let opts = [
    languagePoFile,
    `${options.jsonDirectory}/${options.language}.json`,
    `-p`
  ];
  shell.exec(`node ${options.gettextjsPath} ${opts.join(' ')}`);
};
