// jscs:disable
/* jshint node:true */

'use strict';

module.exports = [
  {
    name: 'sync-from',
    type: String,
    aliases: ['i'],
    default: './translations',
    description: 'Directory of PO files',
    validInConfig: true
  },
  {
    name: 'sync-to',
    type: Array,
    aliases: ['o'],
    default: ['./app'],
    description: 'Directory of JS/HBS files',
    validInConfig: true
  },
  {
    name: 'language',
    type: String,
    aliases: ['l'],
    default: 'en',
    description: 'Language of PO file being used as base',
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
