const { expect } = require('chai');
const {
  validatePlaceholders
} = require('./../../../../lib/utils/validate/validate-placeholders');

describe('validatePlaceholders util', function() {
  it('it works for empty id', function() {
    let validationErrors = [];
    let gettextItem = {
      id: '',
      translations: []
    };
    validatePlaceholders(gettextItem, validationErrors);

    let expected = [];
    expect(validationErrors).to.deep.equal(expected);
  });

  it('it works without placeholder', function() {
    let validationErrors = [];
    let gettextItem = {
      id: 'My test',
      translations: ['My test']
    };
    validatePlaceholders(gettextItem, validationErrors);

    let expected = [];
    expect(validationErrors).to.deep.equal(expected);
  });

  it('it works with translated placeholder', function() {
    let validationErrors = [];
    let gettextItem = {
      id: 'My test {{val}}',
      translations: ['My test {{val}}']
    };
    validatePlaceholders(gettextItem, validationErrors);

    let expected = [];
    expect(validationErrors).to.deep.equal(expected);
  });

  it('it works with wrong placeholder', function() {
    let validationErrors = [];
    let gettextItem = {
      id: 'My test {{val}}',
      translations: ['My test {{val2}}']
    };
    validatePlaceholders(gettextItem, validationErrors);

    let expected = [
      {
        id: 'My test {{val}}',
        level: 'ERROR',
        message:
          'The placeholder "{{val2}}" seems to be wrongly translated. Allowed: {{val}}',
        translation: 'My test {{val2}}'
      }
    ];
    expect(validationErrors).to.deep.equal(expected);
  });

  it('it works with multiple placeholders', function() {
    let validationErrors = [];
    let gettextItem = {
      id: 'My test {{val}} {{val2}} {{val3}}',
      translations: ['My {{val3}} test {{val4}} {{val5}}']
    };
    validatePlaceholders(gettextItem, validationErrors);

    let expected = [
      {
        id: 'My test {{val}} {{val2}} {{val3}}',
        level: 'ERROR',
        message:
          'The placeholder "{{val4}}" seems to be wrongly translated. Allowed: {{val}}, {{val2}}, {{val3}}',
        translation: 'My {{val3}} test {{val4}} {{val5}}'
      }
    ];
    expect(validationErrors).to.deep.equal(expected);
  });

  it('it works with wrong Asian-character placeholder', function() {
    let validationErrors = [];
    let gettextItem = {
      id: 'My test {{val}}',
      translations: ['My test {{该}}']
    };
    validatePlaceholders(gettextItem, validationErrors);

    let expected = [
      {
        id: 'My test {{val}}',
        level: 'ERROR',
        message:
          'The placeholder "{{该}}" seems to be wrongly translated. Allowed: {{val}}',
        translation: 'My test {{该}}'
      }
    ];
    expect(validationErrors).to.deep.equal(expected);
  });
});
