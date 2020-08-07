# Ember-l10n

[![Ember Observer Score](https://emberobserver.com/badges/ember-l10n.svg)](https://emberobserver.com/addons/ember-l10n)
[![npm version](https://badge.fury.io/js/ember-l10n.svg)](https://badge.fury.io/js/ember-l10n)

> A GNU gettext based localization workflow for ember.

## Installation

* `ember install ember-l10n`

Using the string extractor requires:

* [GNU gettext](https://www.gnu.org/software/gettext/) - Convert from/to .po & .pot files

__Note:__ Addon's CLI commands will check dependencies for you and install them on demand (by executing `ember l10n:install`), so you don't have to do this on your own.

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.4 or above
* Ember CLI v2.13 or above
* Node.js v10 or above

## Configuration

You should activate fingerprinting for your translation files, to ensure they can be properly cached.
To do so, you need to add this to your `ember-cli-build.js`:

```js
let app = new EmberAddon(defaults, { 
  // ... other options... 
  fingerprint: {
    // We need to add json to the fingerprinted extensions
    extensions: ['js', 'css', 'png', 'jpg', 'gif', 'map', 'svg', 'json']
  }
});
```

## Usage

There are two primary parts to ember-l10n

1. Ember side: 
    * [Service](#service): API and messages in `JS` files
    * [Helpers](#helpers): Template messages from `HBS` files
    * [Components](#components): For complex messages in `HBS` files
2. CLI:
    * [Extractor](#extractor): Extracts messages from both `JS` and `HBS` files
    * [Converter](#converter): Converts `PO` files to `JSON` consumed by addon
    * [Synchronizer](#synchronizer): Synchronizes message strings with ids from source code (proof reading)

`ember-l10n` follows the [gettext](https://www.gnu.org/software/gettext/) convention that the message ids in your source files are the default language (usually English).

In the ember-l10n workflow, you use the `t`, and `n` helpers and `l10n.t()` / `l10n.n()` functions to define your strings in your project. Then you run the extractor script to generate pot and po files, which you send off to your translators. After receiving the translated po files for additional locales, you use the same script to convert them into json files. These json files are then loaded by ember-l10n in your application and replaced at runtime.

`ember-l10n` provides powerful string substitution and even component substitution for dynamic strings. See the [Components](#components) section below.

## Ember Side

### Service

The  service translates through gettext.js. There are two available methods to
be used for translations message ids from JS source:

* `t(msgid, hash)`
* `n(msgid, msgidPlural, count, hash)`
* `pt(msgid, msgctxt, hash)`
* `pn(msgid, msgidPlural, count, msgctxt, hash)`
* `tVar(msgid, hash)`

`tVar()` works exactly the same as `t()`, but it will be ignored by the gettext parser. This is useful if your message ids are variables, for example: `l10n.t(myProperty)` would create a `myProperty` entry in your po-file when gettext is run. So in this case, `l10n.tVar(myProperty)` should be used instead.

Furthermore, there's an auto initialization feature (default: true), which detects user's locale according to system preferences. If the user's locale is supported in `availableLocales`, the corresponding translations are loaded. If the user's locale is not supported, the default locale will be used instead (default: "en"). Please use the following method to change locales:

* `setLocale(locale)` 

The following utility methods are also available:

* `getLocale()`
* `hasLocale(locale)`
* `detectLocale()`

To configure the path of the JSON files (depending on the path configured via convertor's `-o` option) use the `jsonPath` property (default: "/assets/locales").

When installing via `ember install ember-l10n`, an `l10n` service will be created for you under `app/services/l10n.js`.
There, you can configure (and overwrite) all service properties/methods:

```js
import { computed } from '@ember/object';
import L10n from 'ember-l10n/services/l10n';

export default L10n.extend({
  /**
   * Defines available locales as hash map, where key corresponds
   * to ISO_639-1 country codes and value can be any truthy value.
   * By default, it's used to translate the language codes, which
   * could be used for a language drop down. Adjust the hash map
   * for each new language being added your translatable project.
   *
   * @property availableLocales
   * @type {object}
   * @public
   */
  availableLocales: computed('locale', function() {
    return {
      'en': 'English'
    };
  }),

  /**
   * Flag indicating if service should try to detect user langugage
   * from browser settings and load/set the corresponding JSON file.
   *
   * @property autoInitialize
   * @type {boolean}
   * @public
   */
  autoInitialize: true,
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

### Helpers

For handling your translations within your handlebar templates you can use `t` and `n` helper:

###### Singular translations:

The `t` helper provides gettext singularization for message ids. It takes singular message id as positional arguments. All placeholders can be provided through named arguments.

```hbs
{{t "Your current role: {{role}}" role=someBoundProperty}}
```

If you have strings which are variables (e.g. enums), you can also use the t-var helper: `{{t-var myProperty}}`. It works the same way as the t-helper, but it will be ignored by the gettext parser.

###### Plural translations:

The `n` helper provides gettext pluralization for message ids. It takes singular and plural message ids as well as actual amount as positional arguments. All placeholders can be provided through named arguments (hash).

_Short version:_

```hbs
{{n "{{count}} apple" "{{count}} apples" countProperty}}
```
_Long version:_

Please note: If your count placeholder has another name than "{{count}}", you have to explicitly provide it as named hashed in addition to positional parameter (as well as for all other placeholders within those message ids!).

```hbs
{{n "{{customCount}} apple from shop {{shopName}}" "{{customCount}} apples from shop {{shopName}}" countProperty customCount=countProperty shopName=shopProperty}}
```

###### Contextual translations:
To support contextual translations from templates, there exist both `pt` and `pn` helpers, which accept a context as 2nd or 4th paremeter:

```hbs
{{pt "user" "MY_CONTEXT"}}
```

```hbs
{{pn "user" "users" countProperty "MY_CONTEXT"}}
```
Please note: Both contextual helpers also accept placeholders just as their non-contextual counterparts `t` and `n`.

### Components

If you have complex message ids, which should contain "dynamic" placeholders, which can also be replaced with components (such as a `link-to`), you can use the `get-text` component.

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

Please note: If your message id contains HTML, you have to set `unescapeText=true` on the component. Be sure to use this option only in combination with safe strings and don't make use of it when dealing with user generated inputs (XSS)!

### Testing

In acceptance tests, ember-l10n should work without any further work. In integration tests, you can use the provided test helpers to provide easy to use `{{t}}`,`{{tVar}}` and `{{n}}` helpers:

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

These helpers will basically just pass the string through replacing only placeholders.

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
  --include-patterns (Array) (Default: []) List of regex patterns to include for extraction. Defaults to all files. (configured in config/l10n-extract.js)
    aliases: -x <value>
  --skip-patterns (Array) (Default: ['mirage','fixtures','styleguide']) List of regex patterns to completely ignore from extraction
    aliases: -s <value>
  --skip-dependencies (Array) (Default: []) An array of dependency names to exclude from parsing.
    aliases: -sd <value>
  --skip-all-dependencies (Boolean) (Default: true) If this is true, do not parse the node_modules/lib folders. (configured in config/l10n-extract.js)
    aliases: -sad  
  --extract-to (String) (Default: './translations') Output directory of the PO-file
    aliases: -o <value>
  --keys (Array) (Default: ['t', 'pt:1,2c', 'n:1,2', 'pn:1,2,4c']) Function/Helper Keys to be used for lookup
    aliases: -k <value>
  --language (String) (Default: 'en') Target language of the PO-file
    aliases: -l <value>
  --pot-name (String) (Default: 'messages.pot') The name of generated POT-file (configured in config/l10n-extract.js)
    aliases: -n <value>
  --package (String) (Default: 'My App') The name of the package (configured in config/l10n-extract.js)
    aliases: -p <value>
  --generate-only (Boolean) (Default: false) If only PO-file should be created from POT without extraction
    aliases: -g
  --generate-from (String) (Default: 'messages.pot') Source POT-file to be used in conjunction with `-g` flag
    aliases: -f <value>
  --generate-to (String) (Default: null) Target PO-file to be used in conjunction with `-g` flag - CAUTION: uses `${language}.po` as default
    aliases: -t <value>
```

###### Usage hints:

Once you have extracted message ids with `ember l10n:extract`, which creates a domain `messages.pot` file, you can generate `PO-files` for other languages by using `-g` option without having to run extraction again like so:

* `ember l10n:extract -g -l de` (creates german PO file from POT file)

If you have excluded some files from prior extractions with `-x`  and want to merge them with your messages.pot you can do:

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
    --convert-from (String) (Default: ./translations) Directory of PO file to convert
      aliases: -i <value>
    --convert-to (String) (Default: ./public/assets/locales) Directory to write JSON files to
      aliases: -o <value>
    --language (String) (Default: en) Target language for PO to JSON conversion
      aliases: -l <value>
    --validate-throw (String) (Default: null) For which validation level the script should abort. Can be: ERROR, WARNING, null
      aliases: -vt <value>
    --dry-run (Boolean) (Default: false) If true, only generate but do not actually write to a file
      aliases: -dr

```

Note that this will also validate the generated JSON file for common syntax errors. 
For example, it will check if e.g. `This is {{description}}` is wrongly translated to `Das ist die {{Beschreibung}}`. It will print out any found issues to the console. Alternatively, you can specify `validate-throw=ERROR` to force the script to abort if an error is found. 

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
  --keys (Array) (Default: ['t', 'pt:1,2c', 'n:1,2', 'pn:1,2,4c']) Function/Helper Keys to be used for lookup
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

## Note for Upgrading

### Upgrading from 3.x to 4.x

In 4.0.0, the dependency on `ember-cli-ifa` was dropped. 
If this was only used by `ember-l10n`, you can safely remove it and any configuration for it from your app, 
including generating (and fingerprinting) an assetMap.json file.

If you used to have a custom `jsonPath` configured in your application, please remove it from your `l10n` service, 
and instead configure it in your `config/environment.js`:

```js
'ember-l10n': {
  jsonPath: 'assets/my-custom-locales-path'
}
```

## Looking for help? ##

If it is a bug [please open an issue on github](https://github.com/cropster/ember-l10n/issues).

## Versioning ##

This library follows [Semantic Versioning](http://semver.org)

## Legal

[Cropster](https://cropster.com), GmbH &copy; 2019

[@cropster](http://twitter.com/cropster)

[Licensed under the MIT license](http://www.opensource.org/licenses/mit-license.php)
