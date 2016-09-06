// jscs:disable
/* jshint node:true */

'use strict';

let fs = require('fs');
let nopt = require('nopt');
let path = require('path');
let chalk = require('chalk');
let merge = require('merge');
let shell = require('shelljs');
let makeArray = require('make-array');

let findBy = require('../utils/find-by');
let fileExists = require('../utils/file-exists');
let escapeString = require('../utils/escape-string');

let configPath = 'config/l10n-sync.js';
let syncOptions = require('../utils/sync-options');
let excludeRegex = /(mirage\/|styleguide\/|fixtures\/)/g;
let checkDependencies = require('../utils/check-dependencies');

module.exports = {
  name: 'l10n:sync',
  description: 'Synchronize message strings with message ids (proof reading)',
  works: 'insideProject',

  run: function(options) {
    let promise = checkDependencies();
    promise.then(() => {
      this.start(options);
    });

    return promise;
  },

  start: function(options) {
    this.poFile = `${options.syncFrom}/${options.language}.po`;

    if (!fileExists(this.poFile)) {
      this.ui.writeLine(chalk.red.bold(`PO file ${this.poFile} does not exist!`));
      return;
    }

    this.ui.writeLine(
      chalk.cyan.bold(`
========================================
PARSING SOURCE FILES
========================================
      `)
    );

    let directories = typeof options.syncTo==='string' ? [ options.syncTo ] : options.syncTo;
    let files = shell.find('-R', directories.map(dir => `${dir}/**/*.{js,hbs}`));
    let messages = this.extractMessages();

    let total = 0;
    files.forEach(file => {
      if (file.match(excludeRegex)) {
        return;
      }

      let method;
      switch (file.match(/.\.(js|hbs)$/)[1]){
        case 'js':
          method = this.replaceJS;
          break;
        case 'hbs':
          method = this.replaceHBS;
          break;
        default:
      }

      let changes = 0;
      for (let msgid in messages) {
        let message = messages[msgid];
        options.keys.forEach(key => {
          let result = method.call(
            this,
            file,
            key,
            message.msgid,
            message.msgstr,
            message.msgidPlural,
            message.msgstrPlural
          );

          switch(result) {
            case -1:
              // noop: no match in file
              break;
            case 0:
              // noop: no change in messages
              break;
            case 1:
              changes++;
              total++;
              break;
            default:
          }
        });
      }

      if (changes===0) {
        this.ui.writeLine(`Checked ${file}... ${chalk.yellow('unchanged ✔')}`);
        return;
      }

      this.ui.writeLine(`Checked ${file}... ${chalk.green('updated ✔')}`);
    });

    if (total>0) {
      this.ui.writeLine(chalk.green.bold(`\nUpdated ${total} files ✔`));
    } else {
      this.ui.writeLine(chalk.yellow.bold(`\nNo files updated ✔`));
    }

    this.ui.writeLine(chalk.green.bold(`\nFINISHED ✔`));
  },

  extractMessages: function() {
    //
    // Example of message ids in PO:
    //
    // msgid "There is <strong>{{count}}</strong> shop in this view."
    // msgid_plural "There are <strong>{{count}}</strong> shops in this view."
    // msgstr[0] "There is <strong>{{count}}</strong> shop in this view."
    // msgstr[1] "There are <strong>{{count}}</strong> shops in this view."
    //
    let messages = {};

    let regex = /msgid\s+"(.+)"\s*(?:msgid_plural\s+"(.+)"\s*)?msgstr(?:\[0\])?\s+"(.+)"\s*(?:msgstr(?:\[1\])?\s+"(.+)")?/g;
    let data = fs.readFileSync(this.poFile,'utf8');

    let match;
    while ((match = regex.exec(data))!==null) {
      messages[match[1]] = {
        msgid: match[1],
        msgstr: match[3],
        msgidPlural: match[2],
        msgstrPlural: match[4]
      };
    }

    return messages;
  },

  normalizeKey: function(key) {
    // converts key like: n:1,2 -> n
    return key.replace(
      /([a-zA-Z0-9_])(?:[0-9:,]*)/g,
      "$1"
    );
  },

  removeWhitespace: function(string) {
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
    let regex1 = /((?:(?:n|t)?\(|{{{?)(?:n|t)?\s*["])([^"]+)(["])(?:(,?\s*")([^"]+)(["]))?/g;
    let regex2 = /((?:(?:n|t)?\(|{{{?)(?:n|t)?\s*['])([^']+)(['])(?:(,?\s*')([^']+)([']))?/g;

    string = string.replace(regex1,(match,p1,p2,p3,p4,p5,p6) => {
      return [p1, p2.replace(/\s+/g,' '), p3,p4,p5,p6].join('');
    });

    string = string.replace(regex2,(match,p1,p2,p3,p4,p5,p6) => {
      return [p1, p2.replace(/\s+/g,' '), p3,p4,p5,p6].join('');
    });

    return string;
  },

  replaceJS: function(file,key,msgid,msgstr,msgidPlural,msgstrPlural) {
    //
    // prepare regular expression to match both singular
    // and plural method calls within JS sources:
    //
    // Example:
    //  this.get("l10n").t(
    //    "My string with {{placeholder}}.",
    //    { placeholder: someDynamicValue }
    //  );
    var regex = new RegExp(
      "(\\\." +
        this.normalizeKey(key) +
      "\\\((?:\\\s*)(?:'|\\\"))" +                          // = $1
      "(" + escapeString(msgid) + ")" +                     // = $2
      "('|\\\")" +                                          // = $3
      "(?:" +
        "(\\\s*,\\\s*(?:'|\\\"))" +                         // = $4
        "(" + escapeString(msgidPlural||"") + ")" +         // = $5
        "('|\\\")" +                                        // = $6
      ")?",
      "g"
    );

    // forward to primitive method to do replacement of provided regex
    return this.replaceFile(file,regex,msgid,msgstr,msgidPlural,msgstrPlural);
  },

  replaceHBS: function(file,key,msgid,msgstr,msgidPlural,msgstrPlural) {
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
    var regex = new RegExp(
      "((?:\\\(|{{{?)" +
          this.normalizeKey(key) +
      "\\\s*(?:'|\\\"))" +                                  // = $1
      "(" + escapeString(msgid) + ")" +                     // = $2
      "('|\\\")" +                                          // = $3
      "(?:" +
        "(\\\s*(?:'|\\\"))" +                               // = $4
        "(" + escapeString(msgidPlural||"") + ")" +         // = $5
        "('|\\\")" +                                        // = $6
      ")?",
      "g"
    );

    // forward to primitive method to do replacement of provided regex
    return this.replaceFile(file,regex,msgid,msgstr,msgidPlural,msgstrPlural);
  },

  replaceFile: function(file,regex,msgid,msgstr,msgidPlural,msgstrPlural) {
    // check if there are changed values anyhow
    if (msgid===msgstr && msgidPlural===msgstrPlural) {
      return 0;
    }

    // read source file contents synchronously
    let data = fs.readFileSync(file, 'utf8');

    // remove whitespace within message ids
    data = this.removeWhitespace(data);

    // check if we have a match for this regex
    if (data.match(regex)===null) {
      return -1;
    }

    // now convert msgstr to msgid in content string
    var newData = data.replace(
      regex,
      "$1" + msgstr + "$3" +
      "$4" + (msgstrPlural||"") + "$6"
    );

    // write new data back to source file if
    // the file has changed due to replacing
    // and inform consumer by writing out 1!
    fs.writeFileSync(file, newData, 'utf8');
    return 1;
  },

  // Merge options specified on the command line with those defined in the config
  init: function() {
    if (this._super.init) {
      this._super.init.apply(this, arguments);
    }

    var baseOptions = this.baseOptions();
    var optionsFromConfig = this.config().options;
    var mergedOptions = baseOptions.map(function(syncOption) {
      var option = merge(true, syncOption);

      if ((optionsFromConfig[option.name] !== undefined) && (option.default !== undefined)) {
        option.default = optionsFromConfig[option.name];
        option.description = option.description + ' (configured in ' + configPath + ')';
      }

      return option;
    });

    // Merge custom strategy options if specified
    var strategy = optionsFromConfig.strategy;
    if (typeof strategy === 'object' && Array.isArray(strategy.syncOptions)) {
      mergedOptions = mergedOptions.concat(strategy.syncOptions);
    }

    this.registerOptions({
      availableOptions: mergedOptions
    });
  },

  baseOptions: function() {
    return syncOptions;
  },

  config: function() {
    if (!this._parsedConfig) {
      var ui = this.ui;
      var fullConfigPath = path.join(this.project.root, configPath);
      var config = {};

      if (fs.existsSync(fullConfigPath)) {
        config = require(fullConfigPath);
      }

      var baseOptions = this.baseOptions();
      var configOptions = baseOptions.filter(function(option) {
        return option.validInConfig;
      });
      var optionTypeMap = configOptions.reduce(function(result, option) {
        result[option.name] = option.type;
        return result;
      }, {});

      // Extract whitelisted options
      var options = Object.keys(config).reduce(function(result, optionName) {
        if (findBy(configOptions, 'name', optionName)) {
          result[optionName] = optionTypeMap[optionName] === Array ? makeArray(config[optionName]) : config[optionName];
        } else if (findBy(baseOptions, 'name', optionName)) {
          ui.writeLine(chalk.yellow("Warning: cannot specify option `" + optionName + "` in " + configPath + ", ignoring"));
        } else {
          ui.writeLine(chalk.yellow("Warning: invalid option `" + optionName + "` in " + configPath + ", ignoring"));
        }

        return result;
      }, {});

      // Coerce options into their expected type; this is not done for us since
      // the options are not coming from the CLI arg string
      nopt.clean(options, optionTypeMap);


      this._parsedConfig = {
        options: options
      };
    }

    return this._parsedConfig;
  }
};
