const { expect } = require('chai');
const {
  validateTranslatedPlaceholders
} = require('./../../../../lib/utils/validate/validate-translated-placeholders');

describe('validateTranslatedPlaceholders util', function() {
  it('it works for empty id', function() {
    let validationErrors = [];
    let gettextItem = {
      id: '',
      translations: []
    };
    validateTranslatedPlaceholders(gettextItem, validationErrors);

    let expected = [];
    expect(validationErrors).to.deep.equal(expected);
  });

  it('it works without translated placeholders', function() {
    let validationErrors = [];
    let gettextItem = {
      id: 'My test {{val}}',
      translations: ['My test {{val}}']
    };
    validateTranslatedPlaceholders(gettextItem, validationErrors);

    let expected = [];
    expect(validationErrors).to.deep.equal(expected);
  });

  it('it ignores missing translations for translated placeholders', function() {
    let validationErrors = [];
    let gettextItem = {
      id: 'My test {{val "test"}}',
      translations: ['']
    };
    validateTranslatedPlaceholders(gettextItem, validationErrors);

    let expected = [];
    expect(validationErrors).to.deep.equal(expected);
  });

  it('it works with correct translated placeholders for default language', function() {
    let validationErrors = [];
    let gettextItem = {
      id: 'My test {{val "test"}}',
      translations: ['My test {{val "test"}}']
    };
    validateTranslatedPlaceholders(gettextItem, validationErrors);

    let expected = [];
    expect(validationErrors).to.deep.equal(expected);
  });

  it('it works with correct translated placeholders for other language', function() {
    let validationErrors = [];
    let gettextItem = {
      id: 'My test {{val "test"}}',
      translations: ['Mein test {{val "Test"}}']
    };
    validateTranslatedPlaceholders(gettextItem, validationErrors);

    let expected = [];
    expect(validationErrors).to.deep.equal(expected);
  });

  it('it works with incorrect translated placeholders for other language', function() {
    let validationErrors = [];
    let gettextItem = {
      id: 'My test {{val "test"}}',
      translations: ['Mein test {{val "test"}}']
    };
    validateTranslatedPlaceholders(gettextItem, validationErrors);

    let expected = [
      {
        id: 'My test {{val "test"}}',
        level: 'WARNING',
        message:
          'The content "test" for complex placeholder "val" is not translated',
        translation: 'Mein test {{val "test"}}'
      }
    ];
    expect(validationErrors).to.deep.equal(expected);
  });

  it('it works with changed placeholder names', function() {
    let validationErrors = [];
    let gettextItem = {
      id: 'My test {{val "test"}}',
      translations: ['Mein test {{val2 "test"}}']
    };
    validateTranslatedPlaceholders(gettextItem, validationErrors);

    let expected = [
      {
        id: 'My test {{val "test"}}',
        level: 'ERROR',
        message: 'The complex placeholder "val" is not correctly translated',
        translation: 'Mein test {{val2 "test"}}'
      }
    ];
    expect(validationErrors).to.deep.equal(expected);
  });
});
