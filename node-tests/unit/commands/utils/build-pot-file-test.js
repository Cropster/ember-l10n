const { expect } = require('chai');
const {
  buildPotFile
} = require('./../../../../lib/commands/utils/build-pot-file');

describe('buildPotFile util', function() {
  it('it works for empty items', function() {
    let options = { fromCode: 'UTF-8' };

    let gettextItems = [];
    let fileContent = buildPotFile(gettextItems, options);

    let expected = `
msgid ""
msgstr "Content-Type: text/plain; charset=utf-8"
    `.trim();

    expect(fileContent).to.equal(expected);
  });

  it('it correctly handles multiple items with the same message id', function() {
    let options = { fromCode: 'UTF-8' };
    let fileName = 'test/file.hbs';
    let gettextItems = [
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
      }
    ];

    let fileContent = buildPotFile(gettextItems, options);

    let expected = `
msgid ""
msgstr "Content-Type: text/plain; charset=utf-8"

#: test/file.hbs:6:2
#: test/file.hbs:8:2
msgid "test content"
msgstr ""

#: test/file.hbs:7:2
msgid "other test content"
msgstr ""
    `.trim();

    expect(fileContent).to.equal(expected);
  });

  it('it correctly handles singular & plural items with same message id', function() {
    let options = { fromCode: 'UTF-8' };
    let fileName = 'test/file.hbs';
    let gettextItems = [
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
    ];

    let fileContent = buildPotFile(gettextItems, options);

    let expected = `
msgid ""
msgstr "Content-Type: text/plain; charset=utf-8"

#: test/file.hbs:6:2
#: test/file.hbs:8:2
#: test/file.hbs:12:2
msgid "test content"
msgid_plural "test content plural"
msgstr[0] ""
msgstr[1] ""

#: test/file.hbs:7:2
msgid "other test content"
msgstr ""
    `.trim();

    expect(fileContent).to.equal(expected);
  });

  it('it correctly sorts by fileName and line', function() {
    let options = { fromCode: 'UTF-8' };
    let gettextItems = [
      {
        loc: {
          fileName: 'files/b/test.hbs',
          line: 6,
          column: 2
        },
        messageId: 'test content'
      },
      {
        loc: {
          fileName: 'files/a/test.hbs',
          line: 7,
          column: 2
        },
        messageId: 'other test content'
      },
      {
        loc: {
          fileName: 'files/b/test.hbs',
          line: 4,
          column: 2
        },
        messageId: 'test content'
      }
    ];

    let fileContent = buildPotFile(gettextItems, options);

    let expected = `
msgid ""
msgstr "Content-Type: text/plain; charset=utf-8"

#: files/a/test.hbs:7:2
msgid "other test content"
msgstr ""

#: files/b/test.hbs:4:2
#: files/b/test.hbs:6:2
msgid "test content"
msgstr ""
    `.trim();

    expect(fileContent).to.equal(expected);
  });

  it('it correctly handles message context', function() {
    let options = { fromCode: 'UTF-8' };
    let fileName = 'test/file.hbs';
    let gettextItems = [
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
          line: 4,
          column: 2
        },
        messageId: 'test content',
        messageContext: 'test context'
      },
      {
        loc: {
          fileName,
          line: 22,
          column: 2
        },
        messageId: 'test content',
        messageContext: 'test context'
      },
      {
        loc: {
          fileName,
          line: 21,
          column: 2
        },
        messageId: 'singular message',
        messageIdPlural: 'plural message',
        messageContext: 'test context'
      }
    ];

    let fileContent = buildPotFile(gettextItems, options);

    let expected = `
msgid ""
msgstr "Content-Type: text/plain; charset=utf-8"

#: test/file.hbs:4:2
#: test/file.hbs:22:2
msgctxt "test context"
msgid "test content"
msgstr ""

#: test/file.hbs:6:2
#: test/file.hbs:8:2
msgid "test content"
msgstr ""

#: test/file.hbs:7:2
msgid "other test content"
msgstr ""

#: test/file.hbs:21:2
msgctxt "test context"
msgid "singular message"
msgid_plural "plural message"
msgstr[0] ""
msgstr[1] ""
    `.trim();

    expect(fileContent).to.equal(expected);
  });

  it('it correctly normalizes strings', function() {
    let options = { fromCode: 'UTF-8' };
    let fileName = 'test/file.hbs';
    let gettextItems = [
      {
        loc: {
          fileName,
          line: 6,
          column: 2
        },
        messageId: ` id with
        indented new lines
        and  many     spaces in here  `,
        messageIdPlural: `plural id with
        indented new lines`,
        messageContext: `context with
        indented new lines`
      }
    ];

    let fileContent = buildPotFile(gettextItems, options);

    let expected = `
msgid ""
msgstr "Content-Type: text/plain; charset=utf-8"

#: test/file.hbs:6:2
msgctxt ""
"context with\\n"
"indented new lines"
msgid ""
"id with\\n"
"indented new lines\\n"
"and many spaces in here"
msgid_plural ""
"plural id with\\n"
"indented new lines"
msgstr[0] ""
msgstr[1] ""
    `.trim();

    expect(fileContent).to.equal(expected);
  });

  it('it correctly escapes strings', function() {
    let options = { fromCode: 'UTF-8' };
    let fileName = 'test/file.hbs';
    let gettextItems = [
      {
        loc: {
          fileName,
          line: 6,
          column: 2
        },
        messageId: `a text with ", ', and \` - are they escaped?`
      }
    ];

    let fileContent = buildPotFile(gettextItems, options);

    let expected = `
msgid ""
msgstr "Content-Type: text/plain; charset=utf-8"

#: test/file.hbs:6:2
msgid "a text with \\", ', and \` - are they escaped?"
msgstr ""
    `.trim();

    expect(fileContent).to.equal(expected);
  });
});
