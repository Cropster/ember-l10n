import { guessLocale } from 'ember-l10n/utils/guess-locale';
import { module, test } from 'qunit';

module('Unit | Utility | guess-locale', function() {

  test('it works', function(assert) {
    let result = guessLocale();
    assert.equal(result, 'en', 'it works with no input data');

    result = guessLocale(['en', 'de', 'zh_HK'], ['de-AT', 'de', 'en-US', 'en']);
    assert.equal(result, 'de');

    result = guessLocale(['en', 'de', 'zh_HK'], ['de', 'en-US', 'en']);
    assert.equal(result, 'de');

    result = guessLocale(['en', 'de', 'zh_HK'], ['de_at', 'en-US', 'en'],);
    assert.equal(result, 'de');

    result = guessLocale(['en', 'de', 'zh_HK'], ['de_at', 'en-US', 'en'], { allowSubLocales: true });
    assert.equal(result, 'de_AT');

    result = guessLocale(['en', 'de', 'zh_HK'], ['es-ES', 'es']);
    assert.equal(result, 'en');
  });

  test('it works for Chinese variants', function(assert) {
    let result = guessLocale(['en', 'de', 'zh_HK'], ['zh_CN', 'zh-hk', 'de-AT', 'de', 'en-US', 'en']);
    assert.equal(result, 'zh_HK');

    result = guessLocale(['en', 'de', 'zh_HK'], ['zh_CN', 'zh-hk', 'de-AT', 'de', 'en-US', 'en']);
    assert.equal(result, 'zh_HK');

    result = guessLocale(['en', 'de', 'zh_HK', 'zh_CN'], ['zh-SG', 'de-AT', 'de', 'en-US', 'en']);
    assert.equal(result, 'zh_CN');

    result = guessLocale(['en', 'de', 'zh_HK', 'zh_CN'], ['zh-MO', 'de-AT', 'de', 'en-US', 'en']);
    assert.equal(result, 'zh_HK');
  });

});
