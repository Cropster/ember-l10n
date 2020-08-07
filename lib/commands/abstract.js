'use strict';

let fs = require('fs');
let path = require('path');
let chalk = require('chalk');
let shell = require('shelljs');
let inquirer = require('inquirer');

// enable error reporting
shell.config.fatal = true;

/**
 * Abstract command class. Refer to current implementation of Ember CLI at:
 * https://github.com/ember-cli/ember-cli/blob/master/lib/models/command.js
 *
 * @class AbstractCommand
 */
module.exports = {
  /**
   * Constant being one of `insideProject`, `outsideProject` or `everywhere`.
   *
   *
   */
  works: 'insideProject',

  /**
   * Collection of available options. An option should look like:
   *
   * ```
   *   {
   *     type: <T>,
   *     name: String,
   *     default: String,
   *     aliases:[]<String>,
   *     description: String
   *   }
   * ```
   *
   * @public
   * @property availableOptions
   * @type {Array}
   */
  availableOptions: [],

  /**
   * Directory where to store tmp files during command processings.
   *
   * @public
   * @property tmpFolder
   * @type {String}
   */
  tmpFolder: './tmp/ember-l10n',

  /**
   * Tries to extend `availableOptions` with globals from config.
   *
   * @public
   * @method beforeRun
   * @return {Void}
   */
  beforeRun() {
    this._super(...arguments);

    // try to read global options from `/config/l10n-${command}.js`
    let globals = {};
    let name = this.name.replace(':', '-');
    let module = path.join(this.project.root, 'config', name);

    try {
      globals = require(module);
    } catch (e) {
      return;
    }

    this.availableOptions.map((option) => {
      // a) check if it corresponds with `name`
      let namedOpt = globals[option.name];
      if (namedOpt !== undefined) {
        option.default = namedOpt;
        return option;
      }

      // b) check if it's contained in `aliases`
      let aliases = option.aliases || [];
      for (let i = 0; i < aliases.length; i++) {
        let aliasedOpt = globals[aliases[i]];
        if (aliasedOpt !== undefined) {
          option.default = aliasedOpt;
          return option;
        }
      }

      return option;
    });
  },

  /**
   * Default implementation checks for dependencies and
   * invokes `start()` method after successful checks!
   *
   * @public
   * @method run
   * @return {Promise}
   */
  run(options) {
    return this.checkDependencies_().then(() => this.start(options));
  },

  /**
   * Template method for implementing actual logic after checks.
   *
   * @public
   * @method start
   * @return {Void}
   */
  start() {
    throw new Error(
      `command must implement start() when not overriding run()!`
    );
  },

  /**
   * Checks if all dependencies for l10n commands are installed.
   *
   * @protected
   * @method fileExists_
   * @param {String} file
   * @return {Boolean}
   */
  fileExists_(file) {
    try {
      fs.accessSync(file, fs.F_OK);
    } catch (e) {
      return false;
    }

    return true;
  },

  /**
   * Escapes a string to be used within a regular expressions.
   *
   * @protected
   * @method escapeString_
   * @param {String} input
   * @return {String}
   */
  escapeString_(input) {
    return input.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  },

  /**
   * Checks if all dependencies for l10n commands are installed.
   *
   * @protected
   * @method checkDependencies
   * @return {Promise}
   */
  checkDependencies_() {
    let promiseCallback = (resolve, reject) => {
      if (!this._hasMissingDependencies()) {
        resolve();
        return;
      }

      this.ui.writeLine(
        chalk.red.bold(
          `You have to install missing dependencies for ember-l10n CLI!`
        )
      );

      let question = {
        default: true,
        name: 'install',
        type: 'confirm',
        message: 'Should they be automatically installed (hit ENTER for Yes)?',
      };

      let successCallback = (answer) => {
        if (!answer.install) {
          reject();
          return;
        }

        this.tryInvoke_(() => {
          shell.exec(`ember l10n:install`, () => {
            resolve();
          });
        });
      };

      let failureCallback = () => {
        reject();
      };

      let promise = inquirer.prompt([question]);
      promise.then(successCallback, failureCallback);
    };

    return new Promise(promiseCallback);
  },

  /**
   * Checks if gettext is installed.
   *
   * @protected
   * @method hasGettext_
   * @return {Boolean}
   */
  hasGettext_() {
    let task = this.tryInvoke_(() =>
      shell.exec('gettext --version', { silent: true })
    );
    let isInstalled = task && task.code === 0;

    if (!isInstalled) {
      this.ui.writeLine(chalk.red.bold(`ERROR: gettext is not installed`));
    }

    return isInstalled;
  },

  /**
   * Checks if a `npm` programm is installed on client.
   *
   * @protected
   * @method hasNpmPackage_
   * @return {Boolean}
   */
  hasNpmPackage_(pkg) {
    try {
      require.resolve(pkg);
    } catch (e) {
      this.ui.writeLine(
        chalk.red.bold(`ERROR: ${pkg} npm package is not installed`)
      );
      return false;
    }

    return true;
  },

  /**
   * Wraps function call into try/catch block and
   * logs error message to console for user.
   *
   * @protected
   * @method tryInvoke_
   * @param {Function} function to invoke code of
   * @return {Boolean}
   */
  tryInvoke_(func) {
    if (typeof func !== 'function') {
      return;
    }

    try {
      return func();
    } catch (e) {
      this.ui.writeLine(chalk.red.bold(`ERROR: ${e.message}`));
    }
  },

  /**
   * Checks if all dependencies for l10n commands are installed.
   *
   * @private
   * @method _hasMissingDependencies
   * @return {Boolean}
   */
  _hasMissingDependencies() {
    return !this.hasGettext_();
  },
};
