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
					"I am one plural translation.":[
						"I am one plural translation.",
						"We are multiple plural translations."
					],
					"your have {{count}} unit in your cart.":[
						"You have {{count}} unit in your cart.",
						"You have {{count}} units in your cart."
					]
				};
				const de = {
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

				func(l10nService.get("locale")==='en' ? en : de);
			}
		};
	}
});

moduleForComponent('n', 'Integration | Helper | n', {
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

	Ember.run(() => { l10nService.setLocale('de'); });

	assert.equal(this.$().text().trim(),'Du hast 5 Einheiten in deinem Warenkorb.','Changing locale recomputes translations properly.');

	this.set("count",10);
	assert.equal(this.$().text().trim(),'Du hast 10 Einheiten in deinem Warenkorb.','Updating a bound property recomputes translations properly.');
});
