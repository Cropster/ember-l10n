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
                'KG': {
                  'msgstr': [
                    'kg'
                  ]
                }
              },
              'countries': {
                'KG': {
                  'msgstr': [
                    'Kyrgyzstan'
                  ]
                }
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

module('Integration | Helper | pt', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('service:l10n', mockL10nService);
    this.l10n = this.owner.lookup('service:l10n');

    l10nService = this.owner.lookup('service:l10n');
  });

  test('it works', async function(assert) {
    await l10nService.setLocale('en');

    await render(hbs`{{pt 'KG' 'countries'}}`);
    assert.dom(this.element).hasText('Kyrgyzstan', 'Contextual translations are working correctly.');

    await render(hbs`{{pt 'KG'}}`);
    assert.dom(this.element).hasText('kg', 'Omitting context falls back to message without context.');
  });
});
