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
                'I am one plural translation.': {
                  'msgstr': [
                    'I am one plural translation.',
                    'We are multiple plural translations.'
                  ]
                },
                'You have {{count}} unit in your cart.': {
                  'msgstr': [
                    'You have {{count}} unit in your cart.',
                    'You have {{count}} units in your cart.'
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
                'I am one plural translation.': {
                  'msgstr': [
                    'Ich bin eine Pluralübersetzung.',
                    'Wir sind mehrere Pluralübersetzungen.'
                  ]
                },
                'You have {{count}} unit in your cart.': {
                  'msgstr': [
                    'Du hast {{count}} Einheit in deinem Warenkorb.',
                    'Du hast {{count}} Einheiten in deinem Warenkorb.'
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

module('Integration | Helper | n', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('service:l10n', mockL10nService);
    this.l10n = this.owner.lookup('service:l10n');

    l10nService = this.owner.lookup('service:l10n');
  });

  test('it works', async function(assert) {
    await l10nService.setLocale('en');

    await render(hbs`{{n '<b>I am bold.</b>'}}`);
    assert.equal(this.element.innerHTML, '&lt;b&gt;I am bold.&lt;/b&gt;', 'It escapes text per default.');

    this.set('count', 1);
    await render(hbs`{{n 'I am one plural translation.' 'We are multiple plural translations.' count}}`);
    assert.dom(this.element).hasText('I am one plural translation.', 'Plural translations for count=1 are working.');

    this.set('count', 5);
    await render(hbs`{{n 'I am one plural translation.' 'We are multiple plural translations.' count}}`);
    assert.dom(this.element).hasText('We are multiple plural translations.', 'Plural translations for count>1 are working.');

    this.set('count', 1);
    await render(
      hbs`{{n 'You have {{count}} unit in your cart.' 'You have {{count}} units in your cart.' count count=count}}`
    );
    assert.dom(this.element).hasText('You have 1 unit in your cart.', 'Placeholder translations for count=1 are working.');

    this.set('count', 5);
    assert.dom(this.element).hasText('You have 5 units in your cart.', 'Placeholder translations for count>1 are working.');

    await l10nService.setLocale('de');
    await wait();

    assert.dom(this.element).hasText('Du hast 5 Einheiten in deinem Warenkorb.', 'Changing locale recomputes translations properly.');

    this.set('count', 10);
    assert.dom(this.element).hasText('Du hast 10 Einheiten in deinem Warenkorb.', 'Updating a bound property recomputes translations properly.');
  });
});
