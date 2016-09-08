// jscs:disable
/* jshint node:true */

'use strict';

module.exports = [
  {
    name: 'default-language',
    type: String,
    aliases: ['d'],
    default: 'en',
    description: 'The default language used in message ids',
    validInConfig: true
  },
  {
    name: 'bug-address',
    type: String,
    aliases: ['b'],
    default: 'support@mycompany.com',
    description: 'The email address for translation bugs',
    validInConfig: true
  },
  {
    name: 'copyright',
    type: String,
    aliases: ['c'],
    default: 'My Company',
    description: 'The copyright information',
    validInConfig: true
  },
  {
    name: 'from-code',
    type: String,
    aliases: ['e'],
    default: 'UTF-8',
    description: 'The encoding of the input files',
    validInConfig: true
  },
  {
    name: 'extract-from',
    type: Array,
    aliases: ['i'],
    default: ['./app'],
    description: 'The directory from which to extract the strings',
    validInConfig: true
  },
  {
    name: 'exclude-patterns',
    type: Array,
    aliases: ['x'],
    default: [],
    description: 'List of regex patterns to put into a dedicated `excluded.pot` file',
    validInConfig: true
  },
  {
    name: 'skip-patterns',
    type: Array,
    aliases: ['s'],
    default: ['mirage','fixtures','styleguide'],
    description: 'List of regex patterns to completely ignore from extraction',
    validInConfig: true
  },
  {
    name: 'extract-to',
    type: String,
    aliases: ['o'],
    default: './translations',
    description: 'Output directory of the PO-file',
    validInConfig: true
  },
  {
    name: 'keys',
    type: Array,
    aliases: ['k'],
    default: ['t', 'n:1,2'],
    description: 'Function/Helper Keys to be used for lookup',
    validInConfig: true
  },
  {
    name: 'language',
    type: String,
    aliases: ['l'],
    default: 'en',
    description: 'Target language of the PO-file',
    validInConfig: true
  },
  {
    name: 'pot-name',
    type: String,
    aliases: ['n'],
    default: 'messages.pot',
    description: 'The name of generated POT-file',
    validInConfig: true
  },
  /*{
    name: 'plural-forms',
    type: String,
    aliases: ['n'],
    default: 'nplurals=2; plural=(n!=1);',
    description: 'Plural forms for the PO-file',
    validInConfig: true
  },*/
  {
    name: 'package',
    type: String,
    aliases: ['p'],
    default: 'My App',
    description: 'The name of the package',
    validInConfig: true
  },
  {
    name: 'version',
    type: String,
    aliases: ['v'],
    default: '1.0',
    description: 'The version of the package',
    validInConfig: true
  },
  {
    name: 'generate-only',
    type: Boolean,
    aliases: ['g'],
    default: false,
    description: 'If only PO-file should be created from POT without extraction',
    validInConfig: true
  },
  {
    name: 'generate-from',
    type: String,
    aliases: ['f'],
    default: 'messages.pot',
    description: 'Source POT-file to be used in conjunction with `-g` flag',
    validInConfig: true
  },
  {
    name: 'generate-to',
    type: String,
    aliases: ['t'],
    default: null,
    description: 'Target PO-file to be used in conjunction with `-g` flag - CAUTION: uses `${language}.po` as default',
    validInConfig: true
  },
  {
    name: 'xgettext-template-path',
    type: String,
    default: './node_modules/xgettext-template/bin/xgettext-template',
    description: 'The path where xgettext-template is available',
    validInConfig: true
  },
  {
    name: 'gettextjs-path',
    type: String,
    default: './node_modules/gettext.js/bin/po2json',
    description: 'The path where gettext.js is available',
    validInConfig: true
  }
];
