/* eslint-disable ember/avoid-leaking-state-in-ember-objects */
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import L10n from 'ember-l10n/services/l10n';
import hbs from 'htmlbars-inline-precompile';
import Pretender from 'pretender';

const mockL10nService = L10n.extend({
  autoInitialize: false,
  availableLocales: {
    en: 'en',
    de: 'de'
  }
});

module('Integration | Helper | pt', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('service:l10n', mockL10nService);
    this.l10n = this.owner.lookup('service:l10n');

    this.server = new Pretender(function() {
      let json = {
        'en.json': {
          headers: {
            language: 'en',
            'plural-forms': 'nplurals=2; plural=(n != 1);'
          },
          translations: {
            '': {
              KG: {
                msgstr: ['kg']
              }
            },
            countries: {
              KG: {
                msgstr: ['Kyrgyzstan']
              }
            }
          }
        }
      };

      this.get('/assets/locales/:locale', (request) => {
        let response = json[request.params.locale];
        return [200, {}, JSON.stringify(response)];
      });
    });
  });

  hooks.afterEach(function() {
    this.server.shutdown();
  });

  test('it works', async function(assert) {
    let { l10n } = this;
    await l10n.setLocale('en');

    await render(hbs`{{pt 'KG' 'countries'}}`);
    assert
      .dom(this.element)
      .hasText('Kyrgyzstan', 'Contextual translations are working correctly.');

    await render(hbs`{{pt 'KG'}}`);
    assert
      .dom(this.element)
      .hasText('kg', 'Omitting context falls back to message without context.');
  });
});
