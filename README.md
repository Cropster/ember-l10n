
# Ember-l10n

A generic localization solution for ember projects using gettext.

## Installation

* `npm install ember-l10n --save-dev`

## l10n Service

The  service translates through gettext.js. There are two available methods to be used for translations message ids from JS source:

* `t(msgid, hash)`
* `n(msgid, msgid_plural, count, hash)`

Furthermore, there's an auto initialization feature (default: true), which detects user's locale according to system preferences. If the user's locale is supported in `availableLocales`, the corresponding translations are loaded. If the user's locale is not supported, the default locale will be used instead (default: "en"). Please use the following method to change locales:

* `setLocale(locale)` 

The following utility methods are also availalbe:

* `getLocale()`
* `hasLocale(locale)`
* `detectLocale()`

To configure the path of the JSON files (depending on the path configured via extractor's `-j` option) use the `jsonPath` property (default: "/assets/locales").

Example of how to configure service within an initializer:

```
import L10N from 'ember-l10n/services/l10n';

export function initialize(application) {
  L10N.reopen({
        availableLocales: Ember.computed(function(){ // specify all your available languages
          return {
              'en': this.t('en'),
              'de': this.t('de'),
            };
        }),
        jsonPath: '/custom/path/to/json/files', // provide different location of JSON files
        autoInitialize: false, // no detection, triggered only when calling setLocale() manually
        forceLocale: 'de', // skips language detection, only useful if `autoInitialize:true` (= default)
    });

  application.inject('model', 'l10n', 'service:l10n');
  application.inject('route', 'l10n', 'service:l10n');
  application.inject('controller', 'l10n', 'service:l10n');
  application.inject('component', 'l10n', 'service:l10n');
}

export default {
  name: 'l10n',
  initialize: initialize
};
```


## l10n Helpers

For handling your translations within your handlebar templates you can use `t` and `n` helper:

###### Singular translations:

The `t` helper provides gettext singularization for message ids. It takes singular message id as positional arguments. All
placeholders can be provided through named arguments.

```
{{t "Your current role: {{role}}" role=someBoundProperty}}
```

###### Plural translations:

The `n` helper provides gettext pluralization for message ids. It takes singular and plural message ids as well as actual amount as positional arguments. All placeholders can be provided through named arguments (hash).

```
{{n "{{count}} apple" "{{count}} apples" someBoundProperty count=someBoundProperty}}
```


## Components

If you have complex message ids, which should contain "dynamic" placeholders, which can also be replaced with components (such as a `link-to`), you can use the `get-text` component. It also supports multiple 

```
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

Please note: If your message id contains HTML, you have to set `escapeText=true` on the component.

## Extractor

The extractor script searches your ember project for both JS and HBS sources to get all message ids, generates the corresponding PO files and converts them to JSON files to be used for client side translation within your ember app.

Run the following command from your ember project root to extract message ids:

* `node_modules/ember-l10n/gettext.sh`

To see all available command line options for the extractor script please run:

* `node_modules/ember-l10n/gettext.sh -h`

Using a POT file for "static" translations such as server-side constants etc.:

In case you have message ids, which are not covered in your JS or HBS source, you can provide a POT file containing all these messages used as a base for generating resulting PO files. To do so, either use `-d` option:

* `node_modules/ember-l10n/gettext.sh -d path/to/pot/file.pot`

Or simply put a file called `domain.pot` within your translations directory, which could be configured with `-i` option:

* `node_modules/ember-l10n/gettext.sh -i path/to/po/files`

Please note: The shell script will install all necessary dependencies on first run:

* GNU gettext utilities (https://www.gnu.org/software/gettext/manual/gettext.html)
* HBS template parser (https://github.com/gmarty/xgettext)
* PO2JSON converter (https://github.com/guillaumepotier/gettext.js)

Compiling GNU gettext utilities may take a while, so get a coffee in the meanwhile :)
