import { moduleForComponent, test } from 'ember-qunit';
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
                },
              }
            }
          }
        }

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

moduleForComponent('pt', 'Integration | Helper | pt', {
  integration: true,
  beforeEach() {
    this.register('service:l10n', mockL10nService);
    this.inject.service('l10n', { as: 'l10n' });

    l10nService = this.container.lookup('service:l10n');
  }
});

test('it works', async function(assert) {
  await l10nService.setLocale('en');

  this.render(hbs`{{pt 'KG' 'countries'}}`);
  assert.equal(this.$().text().trim(), 'Kyrgyzstan', 'Contextual translations are working correctly.');

  this.render(hbs`{{pt 'KG'}}`);
  assert.equal(this.$().text().trim(), 'kg', 'Omitting context falls back to message without context.');
});
