import { moduleForComponent, test } from 'ember-qunit';
import Service from 'ember-l10n/services/l10n';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

const mockAjax = Ember.Service.extend({
  request() {
    return {
      then(func) {
        let en = {
          '': {
            'language': 'en',
            'plural-forms': 'nplurals=2; plural=(n!=1);'
          },
          'en': 'English',
          'I\'m a {{placeholder}}.': 'I\'m a {{placeholder}}.'
        };

        let de = {
          '': {
            'language': 'de',
            'plural-forms': 'nplurals=2; plural=(n!=1);'
          },
          'en': 'Englisch',
          'I\'m a {{placeholder}}.': 'Ich bin ein {{placeholder}}.'
        };

        func(l10nService.get('locale') === 'en' ? en : de);
      }
    };
  }
});

const mockL10nService = Service.extend({
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

test('it works', function(assert) {
  // override detected locale!
  l10nService.setLocale('en');

  this.render(hbs`{{t 'en'}}`);
  assert.equal(this.$().text().trim(), 'English', 'Common translations are working.');

  this.set('value', 'PLACEHOLDER');
  this.render(hbs`{{t "I'm a {{placeholder}}." placeholder=value}}`);
  assert.equal(this.$().text().trim(), 'I\'m a PLACEHOLDER.', 'Placeholder translations are working.');

  Ember.run(() => {
    l10nService.setLocale('de');
  });

  assert.equal(this.$().text().trim(), 'Ich bin ein PLACEHOLDER.', 'Changing locale recomputes translations properly.');

  this.set('value', 'PLATZHALTER');
  assert.equal(this.$().text().trim(), 'Ich bin ein PLATZHALTER.', 'Updating a bound property recomputes translations properly.');
});
