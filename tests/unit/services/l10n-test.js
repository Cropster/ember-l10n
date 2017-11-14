import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
import wait from 'ember-test-helpers/wait';

let server;

moduleFor('service:l10n', 'Unit | Service | l10n', {
  needs: [
    'service:l10n-ajax'
  ],

  beforeEach() {
    server = new Pretender(function() {
      this.get(
        '/assets/locales/en.json',
        function() {
          let response = {
            '': {
              'language': 'en',
              'plural-forms': 'nplurals=2; plural=(n!=1);'
            },
            'en': 'English',
            'I\'m a {{placeholder}}.': 'I\'m a {{placeholder}}.',
            'You have {{count}} unit in your cart.': [
              'You have {{count}} unit in your cart.',
              'You have {{count}} units in your cart.'
            ],
            'I\'m a multiline.': 'I\'m a multiline.',
            'STATUS_ACTIVE': 'active'
          };

          return [
            200,
            {
              'Content-Type': 'application/json'
            },
            JSON.stringify(response)
          ];
        }
      );

      this.get(
        '/assets/locales/de.json',
        function() {
          let response = {
            '': {
              'language': 'de',
              'plural-forms': 'nplurals=2; plural=(n!=1);'
            },
            'testing': 'Test'
          };

          return [
            200,
            {
              'Content-Type': 'application/json'
            },
            JSON.stringify(response)
          ];
        }
      );
    });
  },

  afterEach() {
    server.shutdown();
  }
});

test('it works', function(assert) {
  let service = this.subject({
    autoInitialize: false
  });

  assert.ok(service);

  let defaultLocale = service.get('defaultLocale');

  // override detected locale!
  service.setLocale('en');

  assert.strictEqual(
    defaultLocale,
    'en',
    'English is default locale.'
  );

  service.setLocale('hi'); // = Hindi
  assert.strictEqual(
    service.get('locale'),
    defaultLocale,
    'Setting an unsupported locale doesn\'t work.'
  );

  return wait().then(() => {
    assert.strictEqual(
      service.t('en'),
      'English',
      'Singular translations work correctly.'
    );

    assert.strictEqual(
      service.t(
        'I\'m a {{placeholder}}.',
        { placeholder: 'rockstar' }
      ),
      'I\'m a rockstar.',
      'Placeholders work correctly.'
    );

    assert.strictEqual(
      service.t(
        'Current status: {{status}}',
        { status: service.t('STATUS_ACTIVE') }
      ),
      'Current status: active',
      'Placeholders translations work correctly.'
    );

    assert.strictEqual(
      service.tVar(
        'I\'m a {{placeholder}}.',
        { placeholder: 'rockstar' }
      ),
      'I\'m a rockstar.',
      'tVar works correctly.'
    );

    assert.strictEqual(
      service.n(
        'You have {{count}} unit in your cart.',
        'You have {{count}} units in your cart.',
        1,
        { count: 1 }
      ),
      'You have 1 unit in your cart.',
      'Plural translations work correctly with singular form.'
    );

    assert.strictEqual(
      service.n(
        'You have {{count}} unit in your cart.',
        'You have {{count}} units in your cart.',
        2
      ),
      'You have 2 units in your cart.',
      'Plural translations use count implicitly if not set in hash.'
    );

    assert.strictEqual(
      service.n(
        'You have {{count}} unit in your cart.',
        'You have {{count}} units in your cart.',
        5,
        { count: 5 }
      ),
      'You have 5 units in your cart.',
      'Plural translations work correctly with plural form.'
    );

    assert.strictEqual(
      service.t(
        `I'm
        a
        multiline
        phrase.`
      ),
      'I\'m a multiline phrase.',
      'Multiline key lookups work correctly.'
    );

    assert.strictEqual(
      service.t(null),
      null,
      'Non-string values are returned untransformed.'
    );

    assert.strictEqual(
      service.t({
        toString: function(){
          return 'en';
        }
      }),
      'English',
      'Objects with toString() methods uses string representations.'
    );
  });
});

test('detect and swap locale test', function(assert) {
  let window = {};

  let service = this.subject({
    availableLocales: {
      'de': true,
      'en': true,
      'it': true
    },
    autoInitialize: false,
    defaultLocale: 'de',
    _window: window
  });

  assert.strictEqual(service.detectLocale(), 'de', '`defaultLocale` is used on failed detection.');

  window.navigator = { language: 'it' };

  assert.strictEqual(service.detectLocale(), 'it', 'Detected locale is used if listed in `availableLocales`.');

  service.set('forceLocale', 'it');

  assert.strictEqual(service.detectLocale(), 'it', '`forceLocale` is used if listed in `availableLocales`.');

  service.set('forceLocale', 'es');

  assert.strictEqual(service.detectLocale(), 'de', '`defaultLocale` is used if not in `availableLocales`.');

  service.set('defaultLocale', 'en');

  assert.strictEqual(service.getLocale(), 'en', '`defaultLocale` is provided if no locale set.');

  service.setLocale('de');

  return wait().then(() => {
    assert.strictEqual(service.getLocale(), 'de', 'Changing locales via `setLocale()` changes for supported locales.');
    assert.strictEqual(service.t('testing'), 'Test', 'Changing locales via `setLocale()` loads corresponding translations.');
  });
});
