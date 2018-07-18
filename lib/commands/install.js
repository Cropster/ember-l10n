/* eslint-env node */

'use strict';

let chalk = require('chalk');
let shell = require('shelljs');
let AbstractCommand = require('./abstract');
let BaseCommand = Object.create(AbstractCommand);
let os = require('os');
let fs = require('fs');
let path = require('path');

// enable error reporting
shell.config.fatal = true;

/**
 * Command for installing l10n dependencies.
 *
 * Usage: `ember l10n:install`
 *
 * @class InstallCommand
 * @extends AbstractCommand
 */
module.exports = Object.assign(BaseCommand, {
  /**
   * Name of the command.
   *
   * @public
   * @property name
   * @type {String}
   */
  name: 'l10n:install',

  /**
   * Description of the command.
   *
   * @public
   * @property name
   * @type {String}
   */
  description: 'Checks and installs required dependencies for CLI',

  /**
   * Checks if `xgettext`, `xgettext-template` and `gettext-parser`
   * are installed on the client, otherwise tries to install them.
   *
   * @public
   * @method run
   * @return {Void}
   */
  run() {
    let dependency;

    this.ui.writeLine(
      chalk.cyan.bold(`
========================================
CHECKING DEPENDENCIES
========================================
      `)
    );

    // 1) xgettext utilities (JS)
    dependency = 'xgettext';
    let xgettext = this.hasGettext_();
    this.ui.writeLine(`Checking ${dependency}... ${
      xgettext ?
      chalk.green('installed ✔') :
      chalk.red('not installed ✘')
    }`);

    if (!xgettext) {
      this.ui.writeLine(chalk.bold(`\nInstalling ${dependency}...\n`));
      this._installGettext();
    }

    // 2) xgettext-template (HBS)
    dependency = 'xgettext-template';
    let xgettextTemplate = this.hasNpmPackage_(dependency);
    this.ui.writeLine(`Checking ${dependency}... ${
      xgettextTemplate ?
        chalk.green('installed ✔') :
        chalk.red('not installed ✘')
    }`);

    if (!xgettextTemplate) {
      this.ui.writeLine(chalk.bold(`\nInstalling ${dependency}...\n`));
      this._installNpmPackage(dependency);
    }

    // 3) gettext.js (PO2JSON)
    dependency = 'gettext-parser';
    let gettextParser = this.hasNpmPackage_(dependency);
    this.ui.writeLine(`Checking ${dependency}... ${
      gettextParser ?
        chalk.green('installed ✔') :
        chalk.red('not installed ✘')
    }`);

    if (!gettextParser) {
      this.ui.writeLine(chalk.bold(`\nInstalling ${dependency}...\n`));
      this._installNpmPackage(dependency);
    }

    this.ui.writeLine(chalk.green.bold(`\nFINISHED ✔`));
  },

  /**
   * Tries to install `xgettext` via CURL.
   *
   * @private
   * @method _installGettext
   * @return {Void}
   */
  _installGettext() {
    // Auto install does not work for Windows
    // Users need to manually install it there
    if (os.platform().startsWith('win')) {
      throw new Error('On Windows, you need to manually install Gettext. Please see: http://gnuwin32.sourceforge.net/packages/gettext.htm');
    }

    let cur = process.cwd();
    let dir = `${this.tmpFolder}/gettext`;
    let url = 'http://ftp.gnu.org/pub/gnu/gettext/gettext-latest.tar.gz';

    this.tryInvoke_(() => {
      shell.mkdir('-p',dir);
      shell.exec(`curl -L ${url} | tar -xz - -C ${dir} --strip-components=1`);

      shell.cd(dir);

      shell.exec('sh ./configure');
      shell.exec('make');
      shell.exec('make install');
      shell.exec('make clean');
      shell.exec('make distclean');

      shell.cd(cur);
      shell.rm('-rf',dir);
    });
  },

  /**
   * Tries to install a npm package.
   *
   * @private
   * @method _installNpmPackage
   * @param {string} pkg
   * @return {Void}
   */
  _installNpmPackage(pkg) {
    let useYarn = fs.existsSync(path.join(this.project.root, 'yarn.lock'));
    let installCommand = useYarn
      ? `yarn add ${pkg} --dev`
      : `npm install ${pkg} --dev`;

    this.tryInvoke_(() => {
      shell.exec(installCommand);
    });
  }
});
