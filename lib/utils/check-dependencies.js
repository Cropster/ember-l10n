/* eslint-env node */
/* global Promise */

'use strict';

let chalk = require('chalk');
let shell = require('shelljs');
let inquirer = require('inquirer');
let install = require('../commands/install');

module.exports = function checkDependencies() {
  let promiseCallback = (resolve,reject) => {
    if (!install.hasMissingDependencies()) {
      resolve();
      return;
    }

    console.log(chalk.red.bold(`You have to install missing dependencies for ember-l10n CLI!\n`));

    let question = {
      default: true,
      name: 'install',
      type: 'confirm',
      message: 'Should they be automatically installed (hit ENTER for Yes)?'
    };

    let successCallback = answer => {
      if (!answer.install) {
        reject();
        return;
      }

      shell.exec(
        `ember l10n:install`,
        () => { resolve(); }
      );
    };

    let failureCallback = () => {
      reject();
    };

    let promise = inquirer.prompt([question]);
    promise.then(successCallback,failureCallback);
  };

  return new Promise(promiseCallback);
};
