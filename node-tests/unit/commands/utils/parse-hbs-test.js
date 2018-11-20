const { expect } = require('chai');
const { parseHbsFile } = require('./../../../../lib/commands/utils/parse-hbs');


describe('parseHbsFile util', function() {

  it('it correctly parses t helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 2
        },
        messageId: 'test content'
      }
    ]);
  });

  it('it correctly parses n helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/n.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 2
        },
        messageId: 'test content singular',
        messageIdPlural: 'test content plural'
      }
    ]);
  });

  it('it correctly parses indented n helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/n-indented.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 2
        },
        messageId: 'test content singular',
        messageIdPlural: 'test content plural'
      }
    ]);
  });

  it('it correctly parses pt helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/pt.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 2
        },
        messageId: 'test content',
        messageContext: 'test context'
      }
    ]);
  });

  it('it correctly parses pn helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/pn.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 2
        },
        messageId: 'test content singular',
        messageIdPlural: 'test content plural',
        messageContext: 'test context'
      }
    ]);
  });

  it('it correctly parses multiline t helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-multiline.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 2
        },
        messageId: `test content
    across multiple lines
    goes here`
      }
    ]);
  });

  it('it correctly parses t helper in hash', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-in-hash.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 7,
          column: 9
        },
        messageId: 'test content'
      }
    ]);
  });

  it('it correctly parses t helper in positional argument', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-in-positional-arg.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 10
        },
        messageId: 'test content'
      }
    ]);
  });

  it('it correctly parses t helper with placeholders', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-with-placeholder.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 2
        },
        messageId: 'test content {{placeholder}}'
      }
    ]);
  });

  it('it correctly parses t helper as argument for yielded component', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-for-yielded-component.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 7,
          column: 12
        },
        messageId: 'test content'
      }
    ]);
  });

  it('it correctly parses t helper in yielded component', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-in-yielded-component.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 7,
          column: 4
        },
        messageId: 'test content'
      }
    ]);
  });

  it('it correctly parses t helper in if/else block', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-in-if-else.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 2
        },
        messageId: 'if'
      },
      {
        loc: {
          fileName,
          line: 8,
          column: 2
        },
        messageId: 'else 1'
      },
      {
        loc: {
          fileName,
          line: 10,
          column: 2
        },
        messageId: 'else 2'
      }
    ]);
  });

  it('it correctly parses t helper in element argument', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-in-element-argument.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 11
        },
        messageId: 'test content'
      }
    ]);
  });

  it('it correctly parses t helper in element argument string', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-in-element-argument-string.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 12
        },
        messageId: 'test content'
      }
    ]);
  });

  it('it correctly parses t helper in other helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-in-helper.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 11
        },
        messageId: 'test'
      },
      {
        loc: {
          fileName,
          line: 6,
          column: 22
        },
        messageId: 'other'
      }
    ]);
  });

  it('it correctly parses t helper in nested yielded component', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-in-nested-yielded-component.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 8,
          column: 6
        },
        messageId: 'test content'
      }
    ]);
  });

  it('it correctly parses t helper with tags and indentation', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-with-tags.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 2
        },
        messageId: `test with
          <strong>tags</strong> and weird indentation
      works`
      }
    ]);
  });


  it('it correctly parses multiple helpers', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/multiple-helpers.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([
      {
        loc: {
          fileName,
          line: 6,
          column: 2
        },
        messageId: 'test content'
      },
      {
        loc: {
          fileName,
          line: 7,
          column: 2
        },
        messageId: 'other test content'
      },
      {
        loc: {
          fileName,
          line: 8,
          column: 2
        },
        messageId: 'test content'
      },
      {
        loc: {
          fileName,
          line: 12,
          column: 2
        },
        messageId: 'test content',
        messageIdPlural: 'test content plural'
      }
    ]);
  });

  it('it ignores helpers in comments', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/ignore-comments.hbs';
    parseHbsFile(fileName, options, gettextItems);

    expect(gettextItems).to.deep.equal([]);
  });

  it('it throws when not using enough arguments for t helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-few-arguments.hbs';

    expect(() => parseHbsFile(fileName, options, gettextItems))
      .to.throw('t-helper does not seem to have proper arguments: ./node-tests/fixtures/parse-hbs/t-few-arguments.hbs:6:2');
  });

  it('it throws when not using enough arguments for n helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/n-few-arguments.hbs';

    expect(() => parseHbsFile(fileName, options, gettextItems))
      .to.throw('n-helper does not seem to have proper arguments: ./node-tests/fixtures/parse-hbs/n-few-arguments.hbs:6:2');
  });

  it('it throws when not using enough arguments for pt helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/pt-few-arguments.hbs';

    expect(() => parseHbsFile(fileName, options, gettextItems))
      .to.throw('pt-helper does not seem to have proper arguments: ./node-tests/fixtures/parse-hbs/pt-few-arguments.hbs:6:2');
  });

  it('it throws when not using enough arguments for pn helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/pn-few-arguments.hbs';

    expect(() => parseHbsFile(fileName, options, gettextItems))
      .to.throw('pn-helper does not seem to have proper arguments: ./node-tests/fixtures/parse-hbs/pn-few-arguments.hbs:6:2');
  });

  it('it throws on variables as arguments for t helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-with-variable.hbs';

    expect(() => parseHbsFile(fileName, options, gettextItems))
      .to.throw('You need to pass a string as argument to l10n helpers: ./node-tests/fixtures/parse-hbs/t-with-variable.hbs:6:6');
  });

  it('it throws on helpers as arguments for t helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/t-with-helper.hbs';

    expect(() => parseHbsFile(fileName, options, gettextItems))
      .to.throw('You need to pass a string as argument to l10n helpers: ./node-tests/fixtures/parse-hbs/t-with-helper.hbs:6:6');
  });

  it('it throws on variables as arguments for n helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/n-with-variable.hbs';

    expect(() => parseHbsFile(fileName, options, gettextItems))
      .to.throw('You need to pass a string as argument to l10n helpers: ./node-tests/fixtures/parse-hbs/n-with-variable.hbs:6:13');
  });

  it('it throws on variables as arguments for pt helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/pt-with-variable.hbs';

    expect(() => parseHbsFile(fileName, options, gettextItems))
      .to.throw('You need to pass a string as argument to l10n helpers: ./node-tests/fixtures/parse-hbs/pt-with-variable.hbs:6:14');
  });

  it('it throws on variables as arguments for pn helper', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileName = './node-tests/fixtures/parse-hbs/pn-with-variable.hbs';

    expect(() => parseHbsFile(fileName, options, gettextItems))
      .to.throw('You need to pass a string as argument to l10n helpers: ./node-tests/fixtures/parse-hbs/pn-with-variable.hbs:6:25');
  });


});
