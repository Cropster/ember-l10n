/* eslint-disable ember/avoid-leaking-state-in-ember-objects */
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import L10nService from 'ember-l10n/services/l10n';
import hbs from 'htmlbars-inline-precompile';
import Pretender from 'pretender';
import settled from '@ember/test-helpers/settled';

class ExtendedL10nService extends L10nService {
  _loadConfig() {
    let config = {
      locales: ['de', 'en'],
      autoInitialize: false,
      defaultLocale: 'de',
    };

    return super._loadConfig(config);
  }
}

module('Integration | Helper | t-var', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:l10n', ExtendedL10nService);
    this.l10n = this.owner.lookup('service:l10n');

    this.server = new Pretender(function () {
      let json = {
        'en.json': {
          headers: {
            language: 'en',
            'plural-forms': 'nplurals=2; plural=(n != 1);',
          },
          translations: {
            '': {
              en: {
                msgstr: ['English'],
              },
              "I'm a {{placeholder}}.": {
                msgstr: ["I'm a {{placeholder}}."],
              },
            },
          },
        },

        'de.json': {
          headers: {
            language: 'de',
            'plural-forms': 'nplurals=2; plural=(n != 1);',
          },
          translations: {
            '': {
              en: {
                msgstr: ['English'],
              },
              "I'm a {{placeholder}}.": {
                msgstr: ['Ich bin ein {{placeholder}}.'],
              },
            },
          },
        },
      };

      this.get('/assets/locales/:locale', (request) => {
        let response = json[request.params.locale];
        return [200, {}, JSON.stringify(response)];
      });
    });
  });

  hooks.afterEach(function () {
    this.server.shutdown();
  });

  test('it works', async function (assert) {
    let { l10n } = this;
    await l10n.setLocale('en');

    await render(hbs`{{t-var 'en'}}`);
    assert
      .dom(this.element)
      .hasText('English', 'Common translations are working.');

    this.set('value', 'PLACEHOLDER');
    await render(hbs`{{t-var "I'm a {{placeholder}}." placeholder=value}}`);
    assert
      .dom(this.element)
      .hasText("I'm a PLACEHOLDER.", 'Placeholder translations are working.');

    await l10n.setLocale('de');
    await settled();

    assert
      .dom(this.element)
      .hasText(
        'Ich bin ein PLACEHOLDER.',
        'Changing locale recomputes translations properly.'
      );

    this.set('value', 'PLATZHALTER');
    assert
      .dom(this.element)
      .hasText(
        'Ich bin ein PLATZHALTER.',
        'Updating a bound property recomputes translations properly.'
      );
  });
});
