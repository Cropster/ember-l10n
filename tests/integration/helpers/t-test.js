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

moduleForComponent('t', 'Integration | Helper | t', {
  integration: true,
  beforeEach() {
    this.register('service:l10n', mockL10nService);
    this.inject.service('l10n', { as: 'l10n' });

    l10nService = this.container.lookup('service:l10n');
  }
});

test('it works', async function(assert) {
  await l10nService.setLocale('en');

  this.render(hbs`{{t 'en'}}`);
  assert.equal(this.$().text().trim(), 'English', 'Common translations are working.');

  this.render(hbs`{{t '<b>I am bold.</b>'}}`);
  assert.equal(this.$().html(), '&lt;b&gt;I am bold.&lt;/b&gt;', 'It escapes text per default.');

  this.set('value', 'PLACEHOLDER');
  this.render(hbs`{{t "I'm a {{placeholder}}." placeholder=value}}`);
  assert.equal(this.$().text().trim(), 'I\'m a PLACEHOLDER.', 'Placeholder translations are working.');

  await l10nService.setLocale('de');

  assert.equal(this.$().text().trim(), 'Ich bin ein PLACEHOLDER.', 'Changing locale recomputes translations properly.');

  this.set('value', 'PLATZHALTER');
  assert.equal(this.$().text().trim(), 'Ich bin ein PLATZHALTER.', 'Updating a bound property recomputes translations properly.');
});
