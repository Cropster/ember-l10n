/* eslint-disable ember/avoid-leaking-state-in-ember-objects */
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import L10n from 'ember-l10n/services/l10n';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';
import wait from 'ember-test-helpers/wait';

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
                'en': {
                  'msgstr': [
                    'English'
                  ]
                },
                'I\'m a {{placeholder}}.': {
                  'msgstr': [
                    'I\'m a {{placeholder}}.'
                  ]
                }
              }
            }
          },

          '/assets/locales/de.json': {
            'headers': {
              'language': 'de',
              'plural-forms': 'nplurals=2; plural=(n != 1);'
            },
            'translations': {
              '': {
                'en': {
                  'msgstr': [
                    'English'
                  ]
                },
                'I\'m a {{placeholder}}.': {
                  'msgstr': [
                    'Ich bin ein {{placeholder}}.'
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

module('Integration | Helper | t-var', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('service:l10n', mockL10nService);
    this.l10n = this.owner.lookup('service:l10n');

    l10nService = this.owner.lookup('service:l10n');
  });

  test('it works', async function(assert) {
    await l10nService.setLocale('en');

    await render(hbs`{{t-var 'en'}}`);
    assert.dom(this.element).hasText('English', 'Common translations are working.');

    this.set('value', 'PLACEHOLDER');
    await render(hbs`{{t-var "I'm a {{placeholder}}." placeholder=value}}`);
    assert.dom(this.element).hasText('I\'m a PLACEHOLDER.', 'Placeholder translations are working.');

    await l10nService.setLocale('de');
    await wait();

    assert.dom(this.element).hasText('Ich bin ein PLACEHOLDER.', 'Changing locale recomputes translations properly.');

    this.set('value', 'PLATZHALTER');
    assert.dom(this.element).hasText('Ich bin ein PLATZHALTER.', 'Updating a bound property recomputes translations properly.');
  });
});
