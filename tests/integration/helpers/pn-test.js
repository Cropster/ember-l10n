/* eslint-disable ember/avoid-leaking-state-in-ember-objects */
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import L10n from 'ember-l10n/services/l10n';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';

const mockAjax = Service.extend({
  request(url) {
    return {
      then(func) {
        let json = {
          '/assets/locales/en.json': {
            'headers': {
              'language': 'en',
              'plural-forms': 'nplurals=2; plural=(n != 1);'
            },
            'translations': {
              '': {
                'user': {
                  'msgstr': [
                    'user',
                    'users'
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
              }
            }
          }
        };

        func(json[url]);
      }
    };
  }
});

const mockL10nService = L10n.extend({
  ajax: mockAjax.create(),
  autoInitialize: false,
  availableLocales: {
    en: 'en',
    de: 'de'
  }
});

let l10nService;

module('Integration | Helper | pn', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('service:l10n', mockL10nService);
    this.l10n = this.owner.lookup('service:l10n');

    l10nService = this.owner.lookup('service:l10n');
  });

  test('it works', async function(assert) {
    await l10nService.setLocale('en');

    await render(hbs`{{pn 'user' 'users' 1 'menu'}}`);
    assert.dom(this.element).hasText('subscription', 'Contextual translations are working correctly for singular.');

    await render(hbs`{{pn 'user' 'users' 3 'menu'}}`);
    assert.dom(this.element).hasText('subscriptions', 'Contextual translations are working correctly for plural.');

    await render(hbs`{{pn 'user' 'users' 3}}`);
    assert.dom(this.element).hasText('users', 'Omitting context falls back to message without context.');
  });
});
