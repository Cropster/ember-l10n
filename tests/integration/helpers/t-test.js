import { moduleForComponent, test } from 'ember-qunit';
import Service from 'ember-l10n/services/l10n';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

Service.reopen({
  autoInitialize: false
});

let l10nService;

const mockAjax = Ember.Service.extend({
	request: function () {
		return {
			then: function (func) {
				const en = {
					"": {
						"language": "en",
						"plural-forms": "nplurals=2; plural=(n!=1);"
					},
					"en":"English",
					"I'm a {{placeholder}}.":"I'm a {{placeholder}}."
				};
				const de = {
					"": {
						"language": "de",
						"plural-forms": "nplurals=2; plural=(n!=1);"
					},
					"en":"Englisch",
					"I'm a {{placeholder}}.":"Ich bin ein {{placeholder}}."
				};

				func(l10nService.get("locale")==='en' ? en : de);
			}
		};
	}
});

moduleForComponent('t', 'Integration | Helper | t', {
  integration: true,
  beforeEach: function () {
    this.register('service:ajax',mockAjax);
    this.inject.service('ajax',{as:'ajax'});
    l10nService = this.container.lookup('service:l10n');
  }
});

test('it works', function(assert) {
	// override detected locale!
	l10nService.setLocale('en');

	this.render(hbs`{{t 'en'}}`);
	assert.equal(this.$().text().trim(), 'English','Common translations are working.');

	this.set("value","PLACEHOLDER");
	this.render(hbs`{{t "I\'m a {{placeholder}}." placeholder=value}}`);
	assert.equal(this.$().text().trim(),'I\'m a PLACEHOLDER.','Placeholder translations are working.');

	Ember.run(() => { l10nService.setLocale('de'); });

	assert.equal(this.$().text().trim(),'Ich bin ein PLACEHOLDER.','Changing locale recomputes translations properly.');

	this.set("value","PLATZHALTER");
	assert.equal(this.$().text().trim(),'Ich bin ein PLATZHALTER.','Updating a bound property recomputes translations properly.');
});
