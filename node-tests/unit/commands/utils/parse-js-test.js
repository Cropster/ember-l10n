const { expect } = require('chai');
const { parseJsFile } = require('./../../../../lib/commands/utils/parse-js');

describe('parseJsFile util', function() {
  it('it correctly parses t method', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/t.js';
    parseJsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 3,
          column: 4
        },
        messageId: 'text'
      }
    ]);
  });

  it('it correctly parses n method', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/n.js';
    parseJsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 3,
          column: 4
        },
        messageId: 'text',
        messageIdPlural: 'plural'
      }
    ]);
  });

  it('it correctly parses pt method', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/pt.js';
    parseJsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 3,
          column: 4
        },
        messageId: 'text',
        messageContext: 'context'
      }
    ]);
  });

  it('it correctly parses pn method', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/pn.js';
    parseJsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 3,
          column: 4
        },
        messageId: 'text',
        messageIdPlural: 'plural',
        messageContext: 'context'
      }
    ]);
  });

  it('it correctly parses t method with double quotes', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/t-double-quotes.js';
    parseJsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 3,
          column: 4
        },
        messageId: 'text'
      }
    ]);
  });

  it('it correctly parses t method with template literal', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/t-template-literal.js';
    parseJsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 3,
          column: 4
        },
        messageId: `template literal
with new line`
      }
    ]);
  });

  it('it correctly parses a native JS class', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/native-js-class.js';
    parseJsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          column: 11,
          fileName: './node-tests/fixtures/parse-js/native-js-class.js',
          line: 3
        },
        messageId: 'test string'
      }
    ]);
  });

  it('it throws on template literals with placeholder', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName =
      './node-tests/fixtures/parse-js/t-template-literal-placeholder.js';

    expect(() => parseJsFile(fileName, options, gettextItems)).to.throw(
      'You should not use a template literal with variables inside - use l10n placeholders instead: ./node-tests/fixtures/parse-js/t-template-literal-placeholder.js:3:11'
    );
  });

  it('it throws on variables as arguments', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/t-with-variable.js';

    expect(() => parseJsFile(fileName, options, gettextItems)).to.throw(
      'You need to pass a string as argument to l10n methods: ./node-tests/fixtures/parse-js/t-with-variable.js:4:11'
    );
  });

  it('it throws on tertiary operators as arguments', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/t-with-tertiary-operator.js';

    expect(() => parseJsFile(fileName, options, gettextItems)).to.throw(
      'You need to pass a string as argument to l10n methods: ./node-tests/fixtures/parse-js/t-with-tertiary-operator.js:3:11'
    );
  });

  it('it throws on concatenated strings', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/t-with-plus.js';

    expect(() => parseJsFile(fileName, options, gettextItems)).to.throw(
      'You need to pass a string as argument to l10n methods: ./node-tests/fixtures/parse-js/t-with-plus.js:3:11'
    );
  });

  it('it ignores non-member invocations of t', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/t-function.js';
    parseJsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([]);
  });

  it('it correctly parses named exports', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/t-named-exports.js';
    parseJsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 3,
          column: 4
        },
        messageId: 'test 1'
      },
      {
        loc: {
          fileName,
          line: 9,
          column: 4
        },
        messageId: 'test 2'
      }
    ]);
  });

  it('it correctly parses in plain functions', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/t-in-plain-function.js';
    parseJsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 3,
          column: 4
        },
        messageId: 'test 1'
      },
      {
        loc: {
          fileName,
          line: 8,
          column: 2
        },
        messageId: 'test 2'
      }
    ]);
  });

  it('it correctly parses t method as object property', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/t-in-object.js';
    parseJsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 4,
          column: 12
        },
        messageId: 'text'
      }
    ]);
  });

  it('it correctly parses t method as function argument', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/t-in-argument.js';
    parseJsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 3,
          column: 16
        },
        messageId: 'text'
      }
    ]);
  });

  it('it throws when not using enough arguments for t method', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/t-few-arguments.js';

    expect(() => parseJsFile(fileName, options, gettextItems)).to.throw(
      't() invocation does not seem to have proper arguments: ./node-tests/fixtures/parse-js/t-few-arguments.js:3:4'
    );
  });

  it('it throws when not using enough arguments for n method', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/n-few-arguments.js';

    expect(() => parseJsFile(fileName, options, gettextItems)).to.throw(
      'n() invocation does not seem to have proper arguments: ./node-tests/fixtures/parse-js/n-few-arguments.js:3:4'
    );
  });

  it('it throws when not using enough arguments for pt method', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/pt-few-arguments.js';

    expect(() => parseJsFile(fileName, options, gettextItems)).to.throw(
      'pt() invocation does not seem to have proper arguments: ./node-tests/fixtures/parse-js/pt-few-arguments.js:3:4'
    );
  });

  it('it throws when not using enough arguments for pn method', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-js/pn-few-arguments.js';

    expect(() => parseJsFile(fileName, options, gettextItems)).to.throw(
      'pn() invocation does not seem to have proper arguments: ./node-tests/fixtures/parse-js/pn-few-arguments.js:3:4'
    );
  });
});
