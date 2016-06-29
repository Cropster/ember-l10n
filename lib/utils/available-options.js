// jscs:disable
/* jshint node:true */

'use strict';

module.exports = [
  {
    name: 'domain-file',
    type: String,
    aliases: ['d'],
    default: './translations/domain.pot',
    description: 'The path to the domain.pot file',
    validInConfig: true
  },
  {
    name: 'encoding',
    type: String,
    aliases: ['e'],
    default: 'UTF-8',
    description: 'The encoding of the input files',
    validInConfig: true
  },
  {
    name: 'input-directories',
    type: Array,
    aliases: ['i'],
    default: ['./app'],
    description: 'The directory from which to extract the strings',
    validInConfig: true
  },
  {
    name: 'output-directory',
    type: String,
    aliases: ['o'],
    default: './translations',
    description: 'Output directory of the PO file',
    validInConfig: true
  },
  {
    name: 'json-directory',
    type: String,
    aliases: ['j'],
    default: './public/assets/locales',
    description: 'The directory to which to output the JSON files',
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
    name: 'plural',
    type: String,
    aliases: ['n'],
    default: 'nplurals=2; plural=(n!=1);',
    description: 'Plural forms for the PO-file',
    validInConfig: true
  },
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
    description: 'The path where gettex-js is available',
    validInConfig: true
  }
];
