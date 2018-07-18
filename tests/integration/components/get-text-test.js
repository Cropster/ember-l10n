import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | get-text', function(hooks) {
  setupRenderingTest(hooks);

  test('it works', async function(assert) {
    await render(hbs`
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



    assert.equal(find('a').textContent.trim(), 'STATIC REPLACEMENT');
    assert.equal(find(findAll('a')[1]).textContent.trim(), 'DYNAMIC REPLACEMENT');
  });

  test('it works with a given message', async function(assert) {
    await render(hbs`{{get-text message=(t '<b>I am bold.</b>')}}`);
    assert.equal(find('*').innerHTML, '&lt;b&gt;I am bold.&lt;/b&gt;', 'It escapes text per default.');
  });

  test('it works with unescapeText=true set', async function(assert) {
    await render(hbs`{{get-text unescapeText=true message=(t '<b>I am bold.</b>')}}`);
    assert.equal(find('*').innerHTML, '<b>I am bold.</b>', 'It unescapes text with `unescapeText` option.');
  });
});
