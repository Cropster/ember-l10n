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

test('it works with a given message', function(assert) {
  this.render(hbs`{{get-text message=(t '<b>I am bold.</b>')}}`);
  assert.equal(this.$().html(), '&lt;b&gt;I am bold.&lt;/b&gt;', 'It escapes text per default.');
});

test('it works with unescapeText=true set', function(assert) {
  this.render(hbs`{{get-text unescapeText=true message=(t '<b>I am bold.</b>')}}`);
  assert.equal(this.$().html(), '<b>I am bold.</b>', 'It unescapes text with `unescapeText` option.');
});
