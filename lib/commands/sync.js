'use strict';

let fs = require('fs');
let chalk = require('chalk');
let shell = require('shelljs');
let AbstractCommand = require('./abstract');
let BaseCommand = Object.create(AbstractCommand);

// enable error reporting
shell.config.fatal = true;

/**
 * Command for synchronizing translated strings back to sources.
 * NOTE: This assumes that English is used as default language!
 *
 * Usage: `ember l10n:sync`
 *
 * @class SyncCommand
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
  name: 'l10n:sync',

  /**
   * Description of the command.
   *
   * @public
   * @property name
   * @type {String}
   */
  description: 'Synchronize message strings with message ids (proof reading)',

  /**
   * Collection of available options.
   *
   * @public
   * @property availableOptions
   * @type {Array}
   */
  availableOptions: [
    {
      name: 'sync-from',
      type: String,
      aliases: ['i'],
      default: './translations',
      description: 'Directory of PO files',
    },
    {
      name: 'sync-to',
      type: Array,
      aliases: ['o'],
      default: ['./app'],
      description: 'Directory of JS/HBS files',
    },
    {
      name: 'language',
      type: String,
      aliases: ['l'],
      default: 'en',
      description: 'Language of PO file being used as base',
    },
    {
      name: 'keys',
      type: Array,
      aliases: ['k'],
      default: ['t', 'pt:1,2c', 'n:1,2', 'pn:1,2,4c'],
      description: 'Function/Helper Keys to be used for lookup',
    },
  ],

  /**
   * Pattern directories to skip during sync process.
   * Defaults to `mirage`, `styleguide` and `fixtures`.
   *
   * @public
   * @property exlucdeRegex
   * @type {String}
   */
  _excludeRegex: /(mirage\/|styleguide\/|fixtures\/)/g,

  /**
   * Implements template method of abstract class.
   *
   * @public
   * @method start
   * @param {object} options
   * @return {Void}
   */
  start(options) {
    this.poFile = `${options.syncFrom}/${options.language}.po`;

    if (!this.fileExists_(this.poFile)) {
      this.ui.writeLine(
        chalk.red.bold(`PO file ${this.poFile} does not exist!`)
      );
      return;
    }

    this.ui.writeLine(
      chalk.cyan.bold(`
========================================
PARSING SOURCE FILES
========================================
      `)
    );

    let directories =
      typeof options.syncTo === 'string' ? [options.syncTo] : options.syncTo;
    let files = this.tryInvoke_(() =>
      shell.find(
        '-R',
        directories.map((dir) => `${dir}/**/*.{js,hbs}`)
      )
    );
    let messages = this._extractMessages();

    let total = 0;
    files.forEach((file) => {
      if (file.match(this._excludeRegex)) {
        return;
      }

      let method;
      switch (file.match(/.\.(js|hbs)$/)[1]) {
        case 'js':
          method = this._replaceJS;
          break;
        case 'hbs':
          method = this._replaceHBS;
          break;
        default:
      }

      let changes = 0;
      for (let msgid in messages) {
        let message = messages[msgid];
        options.keys.forEach((key) => {
          let result = method.call(
            this,
            file,
            key,
            message.msgid,
            message.msgstr,
            message.msgidPlural,
            message.msgstrPlural
          );

          switch (result) {
            case -1:
              // noop: no match in file
              break;
            case 0:
              // noop: no change in messages
              break;
            case 1:
              changes++;
              break;
            default:
          }
        });
      }

      if (changes === 0) {
        this.ui.writeLine(`Checked ${file}... ${chalk.yellow('unchanged ✔')}`);
        return;
      }

      this.ui.writeLine(`Checked ${file}... ${chalk.green('updated ✔')}`);
      total++;
    });

    if (total > 0) {
      this.ui.writeLine(chalk.green.bold(`\nUpdated ${total} file(s) ✔`));
    } else {
      this.ui.writeLine(chalk.yellow.bold(`\nNo files updated ✔`));
    }

    this.ui.writeLine(chalk.green.bold(`\nFINISHED ✔`));
  },

  /**
   * Extracts message strings from PO file (`msgstr` or `msgstr[0]` and `msgstr[1]`).
   *
   * @private
   * @method _extractMessages
   * @return {Object}
   */
  _extractMessages() {
    //
    // Example of message ids in PO:
    //
    // msgid "There is <strong>{{count}}</strong> shop in this view."
    // msgid_plural "There are <strong>{{count}}</strong> shops in this view."
    // msgstr[0] "There is <strong>{{count}}</strong> shop in this view."
    // msgstr[1] "There are <strong>{{count}}</strong> shops in this view."
    //
    let messages = {};

    let regex =
      /msgid\s+"(.+)"\s*(?:msgid_plural\s+"(.+)"\s*)?msgstr(?:\[0\])?\s+"(.+)"\s*(?:msgstr(?:\[1\])?\s+"(.+)")?/g;
    let data = fs.readFileSync(this.poFile, 'utf8');

    let match;
    while ((match = regex.exec(data)) !== null) {
      messages[match[1]] = {
        msgid: match[1],
        msgstr: match[3],
        msgidPlural: match[2],
        msgstrPlural: match[4],
      };
    }

    return messages;
  },

  /**
   * Method for doing replacements in HBS files.
   *
   * @private
   * @method _replaceHBS
   * @param {string} file
   * @param {string} key
   * @param {string} msgid
   * @param {string} msgstr
   * @param {string} msgidPlural
   * @param {string} msgstrPlural
   * @return {Number} -1=no match, 0=no changes, 1=updated
   */
  _replaceJS(file, key, msgid, msgstr, msgidPlural, msgstrPlural) {
    //
    // prepare regular expression to match both singular
    // and plural method calls within JS sources:
    //
    // Example:
    //  this.get("l10n").t(
    //    "My string with {{placeholder}}.",
    //    { placeholder: someDynamicValue }
    //  );
    /* eslint-disable prefer-template */
    let regex = new RegExp(
      '(\\.' +
        this._normalizeKey(key) +
        '\\((?:\\s*)(?:\'|\\"))' + // = $1
        '(' +
        this.escapeString_(msgid) +
        ')' + // = $2
        '(\'|\\")' + // = $3
        '(?:' +
        '(\\s*,\\s*(?:\'|\\"))' + // = $4
        '(' +
        this.escapeString_(msgidPlural || '') +
        ')' + // = $5
        '(\'|\\")' + // = $6
        ')?',
      'g'
    );
    /* eslint-enable prefer-template */

    // forward to primitive method to do replacement of provided regex
    return this._replaceFile(
      file,
      regex,
      msgid,
      msgstr,
      msgidPlural,
      msgstrPlural
    );
  },

  /**
   * Method for doing replacements in HBS files.
   *
   * @private
   * @method _replaceHBS
   * @param {string} file
   * @param {string} key
   * @param {string} msgid
   * @param {string} msgstr
   * @param {string} msgidPlural
   * @param {string} msgstrPlural
   * @return {Number} -1=no match, 0=no changes, 1=updated
   */
  _replaceHBS(file, key, msgid, msgstr, msgidPlural, msgstrPlural) {
    //
    // prepare regular expression to match both singular
    // and plural template blocks and subexpressions:
    //
    // Example:
    //  {{t
    //      "My string with {{placeholder}}"
    //      placeholder=someDynamicValue
    //  }}
    //
    //  (t
    //      "My string with {{placeholder}}"
    //      placeholder=someDynamicValue
    //  )
    /* eslint-disable prefer-template */
    let regex = new RegExp(
      '((?:\\(|{{{?)' +
        this._normalizeKey(key) +
        '\\s*(?:\'|\\"))' + // = $1
        '(' +
        this.escapeString_(msgid) +
        ')' + // = $2
        '(\'|\\")' + // = $3
        '(?:' +
        '(\\s*(?:\'|\\"))' + // = $4
        '(' +
        this.escapeString_(msgidPlural || '') +
        ')' + // = $5
        '(\'|\\")' + // = $6
        ')?',
      'g'
    );
    /* eslint-enable prefer-template */

    // forward to primitive method to do replacement of provided regex
    return this._replaceFile(
      file,
      regex,
      msgid,
      msgstr,
      msgidPlural,
      msgstrPlural
    );
  },

  /**
   * Primitive method execting replacements in target file.
   *
   * @private
   * @method _replaceFile
   * @param {string} file
   * @param {RegExp} regex
   * @param {string} msgid
   * @param {string} msgstr
   * @param {string} msgidPlural
   * @param {string} msgstrPlural
   * @return {Number} -1=no match, 0=no changes, 1=updated
   */
  _replaceFile(file, regex, msgid, msgstr, msgidPlural, msgstrPlural) {
    // check if there are changed values anyhow
    if (msgid === msgstr && msgidPlural === msgstrPlural) {
      return 0;
    }

    // read source file contents synchronously
    let data = fs.readFileSync(file, 'utf8');

    // remove whitespace within message ids
    data = this._removeWhitespace(data);

    // check if we have a match for this regex
    if (data.match(regex) === null) {
      return -1;
    }

    // now convert msgstr to msgid in content string
    let newData = data.replace(regex, `$1${msgstr}$3$4${msgstrPlural || ''}$6`);

    // write new data back to source file if
    // the file has changed due to replacing
    // and inform consumer by writing out 1!
    fs.writeFileSync(file, newData, 'utf8');
    return 1;
  },

  /**
   * Helper method for removing whitespace from translate strings.
   *
   * @private
   * @method _removeWhitespace
   * @param {string} input
   * @return {string}
   */
  _removeWhitespace(input) {
    // removes whitespace within message ids, otherwise the
    // lookup with PO file's message ids won't work correct!
    // could be either JS or HBS translation markup such as:
    //
    // this.get("l10n").t("My Message Id");
    // this.get("l10n").n("My Message Id Single","My Message Id Plural")
    //
    // {{t "My message Id"}}
    // {{n "My Message Id Single" "My Message Id Plural" count}}
    // {{some-fancy-component translatable-attribute=(t "My Message Id")}}
    // ...
    let regex1 =
      /((?:(?:n|t)?\(|{{{?)(?:n|t)?\s*["])([^"]+)(["])(?:(,?\s*")([^"]+)(["]))?/g;
    let regex2 =
      /((?:(?:n|t)?\(|{{{?)(?:n|t)?\s*['])([^']+)(['])(?:(,?\s*')([^']+)([']))?/g;

    input = input.replace(regex1, (match, p1, p2, p3, p4, p5, p6) => {
      return [p1, p2.replace(/\s+/g, ' '), p3, p4, p5, p6].join('');
    });

    input = input.replace(regex2, (match, p1, p2, p3, p4, p5, p6) => {
      return [p1, p2.replace(/\s+/g, ' '), p3, p4, p5, p6].join('');
    });

    return input;
  },

  /**
   * Helper method for normalizing plural keys (n:1,2 -> n).
   *
   * @private
   * @method _normalizeKey
   * @param {string} key
   * @return {String}
   */
  _normalizeKey(key) {
    return key.replace(/([a-zA-Z0-9_])(?:[0-9:,]*)/g, '$1');
  },
});
