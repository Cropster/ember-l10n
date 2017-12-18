import { moduleFor, test } from 'ember-qunit';
import { get, set } from '@ember/object';
import Pretender from 'pretender';

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
            'headers': {
              'language': 'en',
              'plural-forms': 'nplurals=2; plural=(n!=1);'
            },
            'translations': {
              '': {
                'en': {
                  'msgid': 'en',
                  'msgstr': [
                    'English'
                  ]
                },
                'I\'m a {{placeholder}}.': {
                  'msgstr': [
                    'I\'m a {{placeholder}}.'
                  ]
                },
                'You have {{count}} unit in your cart.': {
                  'msgstr': [
                    'You have {{count}} unit in your cart.',
                    'You have {{count}} units in your cart.'
                  ],
                },
                'STATUS_ACTIVE': {
                  'msgstr': [
                    'active'
                  ]
                }
              },
              'menu': {
                'user': {
                  'msgstr': [
                    'subscription',
                    'subscriptions'
                  ]
                },
                'You have {{count}} subscription': {
                  'msgstr': [
                    'You have {{count}} subscription',
                    'You have {{count}} subscriptions'
                  ]
                }
              }
            }
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
            'headers': {
              'language': 'de',
              'plural-forms': 'nplurals=2; plural=(n!=1);'
            },
            'translations': {
              '': {
                'en': {
                  'msgstr': [
                    'Englisch'
                  ]
                },
                'testing': {
                  'msgstr': [
                    'Test'
                  ]
                }
              },
              'menu': {
                'user': {
                  'msgstr': [
                    'Abonnement',
                    'Abonnements'
                  ]
                },
                'You have {{count}} subscription': {
                  'msgstr': [
                    'Sie haben {{count}} Abonnement',
                    'Sie haben {{count}} Abonnements'
                  ]
                }
              }
            }
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

test('it works', async function(assert) {
  let service = this.subject({
    _window: {
      navigator: {
        language: 'en'
      }
    }
  });

  assert.ok(service);

  assert.strictEqual(
    get(service, 'defaultLocale'),
    'en',
    'English is default locale.'
  );

  try {
    await service.setLocale('hi'); // = Hindi
  } catch(e) {
    // noop
  }

  assert.strictEqual(
    service.getLocale(),
    get(service, 'defaultLocale'),
    'Setting an unsupported locale doesn\'t work.'
  );

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

  await service.setLocale('de');

  assert.strictEqual(
    service.pt('user', 'menu'),
    'Abonnement',
    'Contextual singular method works as expected.'
  );

  assert.strictEqual(
    service.pn('user', 'users', 3, 'menu'),
    'Abonnements',
    'Contextual plural method works as expected.'
  );

  assert.strictEqual(
    service.pn(
      'You have {{count}} subscription',
      'You have {{count}} subscriptions',
      3,
      'menu',
      {
        count: 3
      }
    ),
    'Sie haben 3 Abonnements',
    'Contextual method works with placeholders as expected.'
  );

  assert.strictEqual(service.exists('en'), true, 'exists() delivers correct state for existing keys.');
  assert.strictEqual(service.exists('de'), false, 'exists() delivers correct state for non-existing keys.');
});

test('detect and swap locale test', async function(assert) {
  let _window = {
    navigator: {
      language: null
    }
  };
  let service = this.subject({
    availableLocales: {
      'de': true,
      'en': true,
      'it': true
    },
    autoInitialize: false,
    defaultLocale: 'de',
    _window
  });

  assert.strictEqual(service.detectLocale(), 'de', '`defaultLocale` is used on failed detection.');

  set(_window, 'navigator.language', 'it');

  assert.strictEqual(service.detectLocale(), 'it', 'Detected locale is used if listed in `availableLocales`.');

  set(service, 'forceLocale', 'it');

  assert.strictEqual(service.detectLocale(), 'it', '`forceLocale` is used if listed in `availableLocales`.');

  set(service, 'forceLocale', 'es');

  assert.strictEqual(service.detectLocale(), 'de', '`defaultLocale` is used if not in `availableLocales`.');

  set(service, 'defaultLocale', 'en');

  assert.strictEqual(service.getLocale(), 'en', '`defaultLocale` is provided if no locale set.');

  await service.setLocale('de');

  assert.strictEqual(service.getLocale(), 'de', 'Changing locales via `setLocale()` changes for supported locales.');
  assert.strictEqual(service.t('testing'), 'Test', 'Changing locales via `setLocale()` loads corresponding translations.');
});
