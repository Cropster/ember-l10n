# Ember-l10n

[![Build Status](https://travis-ci.org/Cropster/ember-l10n.svg?branch=master)](https://travis-ci.org/Cropster/ember-l10n)

> A GNU gettext based localization workflow for ember.

## Installation

* `ember install ember-l10n`

Using the string extractor requires:

* GNU gettext, xgettext
*  OS X: `brew install gettext; brew link --force gettext`
* [xgettext-template](https://www.npmjs.com/package/xgettext-template) - extracts strings from handlebars templates
* [gettext.js](https://www.npmjs.com/package/gettext.js) - lightweight port of gettext for JS

ember-l10n uses ember-ajax to fetch locale data.

## Usage

There are two primary parts to ember-l10n

1. Ember side: Service, Helpers, and Components
2. CLI: Contains a string extractor for `JS` and `HBS` files generating `POT`/`PO` files, a converter to convert `PO` files to `JSON` as well as a synchronizer for exchanging message ids in `JS` and `HBS` files (f.e. after proof read original version).

ember-l10n follows the gettext convention that the message ids in your source files
are the default language (usually English).

In the ember-l10n workflow, you use the `t`, and `n` helpers and `l10n.t()` / `l10n.n()`
functions to define your strings in your project. Then you run the extractor script
to generate pot and po files, which you send off to your translators.

After receiving the translated po files for additional locales, you use the same script
to convert them into json files. These json files are then loaded by ember-l10n in your application
and replaced at runtime.

ember-l10n provides powerful string substitution and even component
substitution for dynamic strings. See the Components section below.

###### Usage hints:
Unfortunately, ```xgettext``` doesn't support ES6 template strings ([at the moment](https://savannah.gnu.org/bugs/?50920)), but the addon provides an easy way to handle variables in strings, please refer to [Helpers](#helpers) and [Components](#components) sections.

## Note for Upgrading

The latest version has introduced fingerprinting for the generated JSON files. Please read the [Fingerprinting](#fingerprinting) & [Converter](#converter) sections.

## Ember Side

### Service

The  service translates through gettext.js. There are two available methods to
be used for translations message ids from JS source:

* `t(msgid, hash)`
* `n(msgid, msgidPlural, count, hash)`
* `tVar(msgid, hash)`

`tVar()` works exactly the same as `t()`, but it will be ignored by the 
gettext parser. This is useful if your message ids are variables, for example:
`l10n.t(myProperty)` would create a `myProperty` entry in your po-file
when gettext is run. So in this case, `l10n.tVar(myProperty)` should be used
instead.

Furthermore, there's an auto initialization feature (default: true), which
detects user's locale according to system preferences. If the user's locale is
supported in `availableLocales`, the corresponding translations are loaded. If
the user's locale is not supported, the default locale will be used instead
(default: "en"). Please use the following method to change locales:

* `setLocale(locale)` 

The following utility methods are also available:

* `getLocale()`
* `hasLocale(locale)`
* `detectLocale()`

To configure the path of the JSON files (depending on the path configured via convertor's `-o` option) use the `jsonPath` property (default: "/assets/locales").

When installing via `ember install ember-l10n`, an `l10n` service will be created for you under `app/services/l10n.js`.
There, you can configure (and overwrite) all service properties/methods:

```js
import computed from 'ember-computed';
import L10n from 'ember-l10n/services/l10n';
import l10nFingerprintMap from './../utils/l10n-fingerprint-map';

export default L10n.extend({

  availableLocales: computed(function() {
    return {
      'en': this.t('en')
    };
  }),

  autoInitialize: true,

  jsonPath: '/assets/locales',

  // Make this return null if you do not want to use fingerprinting
  fingerprintMap: l10nFingerprintMap
});
```

You can create an initializer to inject the l10n-service everywhere with the following blueprint:

```bash
ember g ember-l10n-initializer my-l10n-initializer
```

This will produce an initializer such as:

```js
export function initialize(application) {
  application.inject('model', 'l10n', 'service:l10n');
  application.inject('route', 'l10n', 'service:l10n');
  application.inject('controller', 'l10n', 'service:l10n');
  application.inject('component', 'l10n', 'service:l10n');
}

export default {
  initialize: initialize,
  name: 'my-l10n-initializer'
};
```

### Fingerprinting

By default, it is assumed that the locale files are fingerprinted. This makes it possible to aggressively cache them. For this, the default blueprint will generate a file `app/utils/l10n-fingerprint-map.js`. (If you upgraded recently, run `ember g ember-l10n` to create the file).

Whenever you convert a .po file to JSON with `ember l10n:convert`, it will then by default put the created JSON in a fingerprinted subfolder, and update the `l10n-fingerprint-map.js` file with the new fingerprint. This map is then in turn used by the `l10n` service. Note that this means that every language file is fingerprinted separately.

If you do not wish to use fingerprinting, make the `fingerprintMap` property on the service return `null`. Also, you need to deactivate it when converting the .po file: `ember l10n:convert -fingerprint-map=false`.

### Helpers

For handling your translations within your handlebar templates you can use `t`
and `n` helper:

###### Singular translations:

The `t` helper provides gettext singularization for message ids. It takes
singular message id as positional arguments. All placeholders can be provided
through named arguments.

```hbs
{{t "Your current role: {{role}}" role=someBoundProperty}}
```

If you have strings which are variables (e.g. enums), you can also
use the t-var helper: `{{t-var myProperty}}`. It works the same way
as the t-helper, but it will be ignored by the gettext parser.

###### Plural translations:

The `n` helper provides gettext pluralization for message ids. It takes
singular and plural message ids as well as actual amount as positional
arguments. All placeholders can be provided through named arguments (hash).

_Short version:_

```hbs
{{n "{{count}} apple" "{{count}} apples" countProperty}}
```
_Long version:_

Please note: If your count placeholder has another name than "{{count}}", 
you have to explicitly provide it as named hashed in addition to positional 
parameter (as well as for all other placeholders within those message ids!).

```hbs
{{n "{{customCount}} apple from shop {{shopName}}" "{{customCount}} apples from shop {{shopName}}" countProperty customCount=countProperty shopName=shopProperty}}
```

### Components

If you have complex message ids, which should contain "dynamic" placeholders,
which can also be replaced with components (such as a `link-to`), you can use
the `get-text` component.

```hbs
{{#get-text 
  message=(t "My translation with {{dynamicLink 'optional link text'}} and {{staticLink}}.") as |text placeholder|}}
  {{!-- You can omit the if helper if you have only one placeholder --}}
  {{~#if (eq placeholder 'dynamicLink')}}
      {{~#link-to 'my-route'}}
        {{~text}} {{!-- will render 'optional link text' so that it's contained in PO file! --}}
    {{~/link-to~}}
   {{~/if~}}
   {{~#if (eq placeholder 'staticLink')}}
      <a href="http://www.google.com">Google</a>
   {{~/if~}}
{{/get-text}}
```

Please note: If your message id contains HTML, you have to set `unescapeText=true` on the component. 
Be sure to use this option only in combination with safe strings and don't make use of it when dealing 
with user generated inputs (XSS)!

### Testing

In acceptance tests, ember-l10n should work without any further work.
In integration tests, you can use the provided test helpers to provide easy to use `{{t}}`,`{{tVar}}` and `{{n}}` helpers:

```js
// tests/integration/components/my-component-test.js
import l10nTestHelper from 'ember-l10n/test-helpers';

moduleForComponent('my-component', 'Integration | Component | my component', {
  integration: true,

  beforeEach() {
    l10nTestHelper(this);
  }
});
```

These helpers will basically just pass the string through.

## 2. CLI

### Extractor

The extractor extracts message ids from the JS and HBS files in your Ember project. It generates the corresponding PO files for translation. Later, it will convert the translated POs into JSON files to be used for client side translation within your Ember app. Please note: Make sure turning off the development server while extracting, otherwise process slows down due to livereload!

Run the following command from your Ember project root for extraction:

* `ember l10n:extract`

To see all available command line options for the extractor script please run:

* `ember l10n:extract -h`

```
ember l10n:extract <options...>
  Extract message ids from app
  --default-language (String) (Default: 'en') The default language used in message ids
    aliases: -d <value>
  --bug-address (String) (Default: 'support@mycompany.com') The email address for translation bugs (configured in config/l10n-extract.js)
    aliases: -b <value>
  --copyright (String) (Default: 'My Company') The copyright information (configured in config/l10n-extract.js)
    aliases: -c <value>
  --from-code (String) (Default: 'UTF-8') The encoding of the input files
    aliases: -e <value>
  --extract-from (Array) (Default: ['./app']) The directory from which to extract the strings
    aliases: -i <value>
  --exclude-patterns (Array) (Default: []) List of regex patterns to put into a dedicated `excluded.pot` file (configured in config/l10n-extract.js)
    aliases: -x <value>
  --skip-patterns (Array) (Default: ['mirage','fixtures','styleguide']) List of regex patterns to completely ignore from extraction
    aliases: -s <value>
  --skip-dependencies (Array) (Default: []) An array of dependency names to exclude from parsing.
    aliases: -sd <value>
  --skip-all-dependencies (Boolean) (Default: true) If this is true, do not parse the node_modules/lib folders. (configured in config/l10n-extract.js)
    aliases: -sad  
  --extract-to (String) (Default: './translations') Output directory of the PO-file
    aliases: -o <value>
  --keys (Array) (Default: ['t','n:1,2']) Function/Helper Keys to be used for lookup
    aliases: -k <value>
  --language (String) (Default: 'en') Target language of the PO-file
    aliases: -l <value>
  --pot-name (String) (Default: 'messages.pot') The name of generated POT-file (configured in config/l10n-extract.js)
    aliases: -n <value>
  --package (String) (Default: 'My App') The name of the package (configured in config/l10n-extract.js)
    aliases: -p <value>
  --version (String) (Default: '1.0') The version of the package
    aliases: -v <value>
  --generate-only (Boolean) (Default: false) If only PO-file should be created from POT without extraction
    aliases: -g
  --generate-from (String) (Default: 'messages.pot') Source POT-file to be used in conjunction with `-g` flag
    aliases: -f <value>
  --generate-to (String) (Default: null) Target PO-file to be used in conjunction with `-g` flag - CAUTION: uses `${language}.po` as default
    aliases: -t <value>
  --xgettext-template-path (String) (Default: './node_modules/xgettext-template/bin/xgettext-template') The path where xgettext-template is available
  --gettextjs-path (String) (Default: './node_modules/gettext.js/bin/po2json') The path where gettext.js is available
```

###### Usage hints:

Once you have extracted message ids with `ember l10n:extract`, which creates a domain `messages.pot` file, you can generate `PO-files` for other languages by using `-g` option without having to run extraction again like so:

* `ember l10n:extract -g -l de` (creates german PO file from POT file)

If you have excluded some files from prior extractions with `-x`  and want to merge them with your messages.pot you can do:

* `ember l10n:extract -g -f excluded.pot -t messages.pot` (merge POT files)
* `ember l10n:extract -g -l en` (merge english PO file)
* `ember l10n:extract -g -l de` (merge german PO file)

### Converter

The converter will turn a given `PO` into a `JSON` file to be loaded by the service.

Run the following command from your Ember project root for conversion:

* `ember l10n:convert`

To see all available command line options for the converter script please run:

* `ember l10n:convert -h`

```
ember l10n:convert <options...>
  Convert PO files to JSON
  --convert-from (String) (Default: './translations') Directory of PO file to convert
    aliases: -i <value>
  --convert-to (String) (Default: './public/assets/locales') Directory to write JSON files to
    aliases: -o <value>
  --fingerprint-map (String) (Default: ./app/utils/l10n-fingerprint-map.js) Path to the fingerprint-map file. Set to false to deactivate fingerprinting.
    aliases: -f <value>
  --language (String) (Default: 'en') Target language for PO to JSON conversion
    aliases: -l <value>
  --gettextjs-path (String) (Default: './node_modules/gettext.js/bin/po2json') The path where gettext.js is available
```

Note that by default, this will create a fingerprinted json file & update the `app/utils/l10n-fingerprint-map.js` accordingly. If you do not wish to use fingerprinting, use  `--fingerprint-map=false`.

### Synchronizer

The synchronizer will parse a given `PO` file, use message strings from each entry and uses them as new message ids accross `JS` and `HBS` files in your app. This is especially helpful if you proof read your current message ids before handing them over to translators for other languages.

Run the following command from your Ember project root for synchronization:

* `ember l10n:sync`

To see all available command line options for the synchronization script please run:

* `ember l10n:sync -h`

```
ember l10n:sync <options...>
  Synchronize message strings with message ids (proof reading)
  --sync-from (String) (Default: './translations') Directory of PO files
    aliases: -i <value>
  --sync-to (Array) (Default: ['./app']) Directory of JS/HBS files
    aliases: -o <value>
  --language (String) (Default: 'en') Language of PO file being used as base
    aliases: -l <value>
  --keys (Array) (Default: ['t','n:1,2']) Function/Helper Keys to be used for lookup
    aliases: -k <value>
```

### Global options

If you want to set global options for any of the above commands for your project, you can do so by providing a config file under `config/l10n-${command}.js`. An example of global options for `extract` command located under `config/l10n-extract.js` could look like this:

```
module.exports = {
  "bug-address": "support@anothercompany.com",
  "copyright": "Copyright by Another Company",
  "package": "Another App",
  "exclude-patterns": [
    "\/some\/exclude\/path",
    "some-other-pattern(?!not-followed-by-this)",
  ],
  "skip-patterns": [
    "\/some\/skip\/path",
    "(?:\/another\/skip)?path",
  ]
}
```

## Looking for help? ##

If it is a bug [please open an issue on github](https://github.com/cropster/ember-l10n/issues).

## Versioning ##

This library follows [Semantic Versioning](http://semver.org)

## Legal

[Cropster](https://cropster.com), GmbH &copy; 2017

[@cropster](http://twitter.com/cropster)

[Licensed under the MIT license](http://www.opensource.org/licenses/mit-license.php)
