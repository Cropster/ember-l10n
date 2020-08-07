'use strict';

let chalk = require('chalk');
let shell = require('shelljs');
let AbstractCommand = require('./abstract');
let BaseCommand = Object.create(AbstractCommand);
let os = require('os');

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
   * Checks if `xgettext`, are installed on the client, otherwise tries to install them.
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
    this.ui.writeLine(
      `Checking ${dependency}... ${
        xgettext ? chalk.green('installed ✔') : chalk.red('not installed ✘')
      }`
    );

    if (!xgettext) {
      this.ui.writeLine(chalk.bold(`\nInstalling ${dependency}...\n`));
      this._installGettext();
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
      throw new Error(
        'On Windows, you need to manually install Gettext. Please see: http://gnuwin32.sourceforge.net/packages/gettext.htm'
      );
    }

    let cur = process.cwd();
    let dir = `${this.tmpFolder}/gettext`;
    let url = 'http://ftp.gnu.org/pub/gnu/gettext/gettext-latest.tar.gz';

    this.tryInvoke_(() => {
      shell.mkdir('-p', dir);
      shell.exec(`curl -L ${url} | tar -xz - -C ${dir} --strip-components=1`);

      shell.cd(dir);

      shell.exec('sh ./configure');
      shell.exec('make');
      shell.exec('make install');
      shell.exec('make clean');
      shell.exec('make distclean');

      shell.cd(cur);
      shell.rm('-rf', dir);
    });
  },
});
