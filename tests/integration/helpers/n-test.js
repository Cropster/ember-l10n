import { moduleForComponent, test } from 'ember-qunit';
import Service from 'ember-l10n/services/l10n';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import Pretender from 'pretender';
import Ember from 'ember';

Service.reopen({
  autoInitialize: false,
  availableLocales: Ember.computed(function(){
    return {
      'en': this.t('en'),
      'de': this.t('de'),
    };
  })
});

let server;
let service;

moduleForComponent('n', 'Integration | Helper | n', {
  integration: true,
  beforeEach() {
    server = new Pretender(function(){
      this.get(
        '/assets/locales/en.json',
        function() {
          const response = {
            "": {
              "language": "en",
              "plural-forms": "nplurals=2; plural=(n!=1);"
            },
            "I am one plural translation.":[
              "I am one plural translation.",
              "We are multiple plural translations."
            ],
            "your have {{count}} unit in your cart.":[
              "You have {{count}} unit in your cart.",
              "You have {{count}} units in your cart."
            ]
          };

          return [
            200,
            {
              "Content-Type": "application/json"
            },
            JSON.stringify(response)
          ];
        }
      );

      this.get(
        '/assets/locales/de.json',
        function() {
          const response = {
            "": {
              "language": "de",
              "plural-forms": "nplurals=2; plural=(n!=1);"
            },
            "I am one plural translation.":[
              "Ich bin eine Pluralübersetzung.",
              "Wir sind mehrere Pluralübersetzungen."
            ],
            "You have {{count}} unit in your cart.":[
              "Du hast {{count}} Einheit in deinem Warenkorb.",
              "Du hast {{count}} Einheiten in deinem Warenkorb."
            ]
          };

          return [
            200,
            {
              "Content-Type": "application/json"
            },
            JSON.stringify(response)
          ];
        }
      );
    });

    service = this.container.lookup('service:l10n');
  },
  afterEach() {
    server.shutdown();
  }
});

test('it works', function(assert) {

  assert.expect(6);
  service.setLocale('en');

  return wait().then(() => {
  	this.set("count",1);
  	this.render(hbs`{{n 'I am one plural translation.' 'We are multiple plural translations.' count}}`);
  	assert.equal(this.$().text().trim(), 'I am one plural translation.','Plural translations for count=1 are working.');

  	this.set("count",5);
  	this.render(hbs`{{n 'I am one plural translation.' 'We are multiple plural translations.' count}}`);
  	assert.equal(this.$().text().trim(), 'We are multiple plural translations.','Plural translations for count>1 are working.');

  	this.set("count",1);
  	this.render(hbs`{{n 'You have {{count}} unit in your cart.' 'You have {{count}} units in your cart.' count count=count}}`);
  	assert.equal(this.$().text().trim(),'You have 1 unit in your cart.','Placeholder translations for count=1 are working.');

  	this.set("count",5);
  	assert.equal(this.$().text().trim(),'You have 5 units in your cart.','Placeholder translations for count>1 are working.');

  	service.setLocale('de');

    return wait().then(() => {
      assert.equal(this.$().text().trim(),'Du hast 5 Einheiten in deinem Warenkorb.','Changing locale recomputes translations properly.');

      this.set("count",10);
      assert.equal(this.$().text().trim(),'Du hast 10 Einheiten in deinem Warenkorb.','Updating a bound property recomputes translations properly.');
    });
  });
});
