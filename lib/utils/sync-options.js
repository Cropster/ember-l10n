// jscs:disable
/* jshint node:true */

'use strict';

module.exports = [
  {
    name: 'input-directory',
    type: String,
    aliases: ['i'],
    default: './translations',
    description: 'Directory of PO file to convert',
    validInConfig: true
  },
  {
    name: 'output-directories',
    type: Array,
    aliases: ['o'],
    default: ['./app'],
    description: 'Directory to write JSON files to',
    validInConfig: true
  },
  {
    name: 'language',
    type: String,
    aliases: ['l'],
    default: 'en',
    description: 'Target language for PO to JSON conversion',
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
];
