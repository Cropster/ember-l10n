import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
import wait from 'ember-test-helpers/wait';

let server;

moduleFor('service:l10n', 'Unit | Service | l10n', {
  needs: ['service:l10n-ajax'],

  beforeEach() {
    server = new Pretender(function() {
      this.get(
        '/assets/locales/en.json',
        function() {
          const response = {
            '': {
              'language': 'en',
              'plural-forms': 'nplurals=2; plural=(n!=1);'
            },
            'en': 'English',
            'I\'m a {{placeholder}}.': 'I\'m a {{placeholder}}.',
            'You have {{count}} unit in your cart.': [
              'You have {{count}} unit in your cart.',
              'You have {{count}} units in your cart.'
            ]
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
    // ajax: mockAjax
  });

  assert.ok(service);

  let defaultLocale = service.get('defaultLocale');

  // override detected locale!
  service.setLocale('en');

  assert.equal(
    defaultLocale,
    'en',
    'English is default locale.'
  );

  service.setLocale('hi'); // = Hindi
  assert.equal(
    service.get('locale'),
    defaultLocale,
    'Setting an unsupported locale doesn\'t work.'
  );

  return wait().then(() => {
    assert.equal(
      service.t('en'),
      'English',
      'Singular translations work correctly.'
    );
    assert.equal(
      service.t(
        'I\'m a {{placeholder}}.',
        { placeholder: 'rockstar' }
      ),
      'I\'m a rockstar.',
      'Placeholders work correctly.'
    );

    assert.equal(
      service.n(
        'You have {{count}} unit in your cart.',
        'You have {{count}} units in your cart.',
        1,
        { count: 1 }
      ),
      'You have 1 unit in your cart.',
      'Plural translations work correctly with singular form.'
    );

    assert.equal(
      service.n(
        'You have {{count}} unit in your cart.',
        'You have {{count}} units in your cart.',
        5,
        { count: 5 }
      ),
      'You have 5 units in your cart.',
      'Plural translations work correctly with plural form.'
    );
  });
});
