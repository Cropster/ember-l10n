import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('get-text', 'Integration | Component | get-text', {
  integration: true
});

test('it works', function(assert) {
  this.render(hbs`
  	{{#get-text
  			message=(t "Makes placeholders for {{dynamic_blocks}} {{linkToSomeRoute 'DYNAMIC REPLACEMENT'}} within translations possible.") as |text placeholder|}}
  			{{placeholder}}
        {{text}}
        {{~#if (eq placeholder "dynamic_blocks")}}
  				<a href="#">STATIC REPLACEMENT</a>
  			{{~/if}}
  			{{~#if (eq placeholder "linkToSomeRoute")}}
  				{{~#link-to 'index'}}
  					{{~text}}
  				{{~/link-to}}
  			{{~/if}}
  	{{/get-text}}
  `);

  assert.equal(this.$('a:eq(0)').text().trim(), 'STATIC REPLACEMENT');
  assert.equal(this.$('a:eq(1)').text().trim(), 'DYNAMIC REPLACEMENT');
});
