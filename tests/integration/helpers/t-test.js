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

moduleForComponent('t', 'Integration | Helper | t', {
  integration: true,
  beforeEach: function () {
    server = new Pretender(function(){
      this.get(
        '/assets/locales/en.json',
        function() {
          const response = {
            "": {
              "language": "en",
              "plural-forms": "nplurals=2; plural=(n!=1);"
            },
            "en":"English",
            "I'm a {{placeholder}}.":"I'm a {{placeholder}}."
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
            "en":"Englisch",
            "I'm a {{placeholder}}.":"Ich bin ein {{placeholder}}."
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
  }
});

test('it works', function(assert) {
	assert.expect(4);

  service.setLocale('en');

  return wait().then(() => {
    this.render(hbs`{{t 'en'}}`);
  	assert.equal(this.$().text().trim(), 'English','Common translations are working.');

  	this.set("value","PLACEHOLDER");
  	this.render(hbs`{{t "I\'m a {{placeholder}}." placeholder=value}}`);
  	assert.equal(this.$().text().trim(),'I\'m a PLACEHOLDER.','Placeholder translations are working.');

  	service.setLocale('de');

    return wait().then(() => {
    	assert.equal(this.$().text().trim(),'Ich bin ein PLACEHOLDER.','Changing locale recomputes translations properly.');

    	this.set("value","PLATZHALTER");
    	assert.equal(this.$().text().trim(),'Ich bin ein PLATZHALTER.','Updating a bound property recomputes translations properly.');
    });
  });
});
