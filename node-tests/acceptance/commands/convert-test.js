const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const rimraf = require('rimraf');
const Command = require('ember-cli/lib/models/command');
const MockUI = require('console-ui/mock'); // eslint-disable-line
const ConvertCommand = require('./../../../lib/commands/convert');

function getOptions(options = {}) {
  return Object.assign(
    {
      convertFrom: './tmp/ember-l10n-tests',
      convertTo: './tmp/ember-l10n-tests',
      language: 'en',
      validateThrow: null,
      dryRun: false
    },
    options
  );
}

function readJSONFromFile(fileName) {
  let fileContent = fs.readFileSync(fileName, 'UTF-8');
  return JSON.parse(fileContent);
}

describe('convert command', function() {
  let project;
  let tmpDir = './tmp/ember-l10n-tests';

  this.timeout(100000);

  beforeEach(function() {
    project = {
      root: path.resolve('.'),
      addonPackages: {},
      hasDependencies() {
        return true;
      },
      isEmberCLIProject() {
        return true;
      }
    };

    shell.mkdir('-p', tmpDir);
  });

  afterEach(function() {
    rimraf.sync(tmpDir);
  });

  function createCommand(options = {}) {
    Object.assign(options, {
      ui: new MockUI(),
      project,
      environment: {},
      settings: {}
    });

    let TestCommand = Command.extend(ConvertCommand);
    return new TestCommand(options);
  }

  it('it correctly converts a po file', async function() {
    let options = getOptions({});

    // First put the example en.po in the output folder
    fs.copyFileSync(
      './node-tests/fixtures/convert/en.po',
      `${options.convertFrom}/en.po`
    );

    let cmd = createCommand();
    await cmd.run(options);

    let actualFileContent = readJSONFromFile('./tmp/ember-l10n-tests/en.json');
    let expectedFileContent = readJSONFromFile(
      './node-tests/fixtures/convert/expected.json'
    );

    expect(actualFileContent).to.deep.equals(expectedFileContent);

    // Ensure order of props is correct as well
    let actualNamespaces = Object.keys(actualFileContent.translations);
    let expectedNamespaces = Object.keys(expectedFileContent.translations);

    expect(actualNamespaces).to.deep.equal(
      expectedNamespaces,
      'namespace sorting is correct'
    );

    actualNamespaces.forEach((namespace) => {
      let actualItems = Object.keys(actualFileContent.translations[namespace]);
      let expectedItems = Object.keys(
        expectedFileContent.translations[namespace]
      );
      expect(actualItems).to.deep.equal(
        expectedItems,
        `item sorting for namespace ${namespace} is correct`
      );
    });
  });

  it('it appends a semicolon to the plural forms if it is missing', async function() {
    let options = getOptions({});

    // First put the example en.po in the output folder
    fs.copyFileSync(
      './node-tests/fixtures/convert/en-plural-form-no-semicolon.po',
      `${options.convertFrom}/en.po`
    );

    let cmd = createCommand();
    await cmd.run(options);

    let actualFileContent = readJSONFromFile('./tmp/ember-l10n-tests/en.json');
    let expectedFileContent = {
      charset: 'utf-8',
      headers: {
        'content-transfer-encoding': '8bit',
        'content-type': 'text/plain; charset=UTF-8',
        language: 'en',
        'language-team': 'none',
        'last-translator': 'Automatically generated',
        'mime-version': '1.0',
        'plural-forms': 'nplurals=2; plural=(n != 1);',
        'po-revision-date': '2018-07-20 08:39+0200',
        'pot-creation-date': '2018-07-20 08:39+0200',
        'project-id-version': 'My App 1.0',
        'report-msgid-bugs-to': 'support@mycompany.com'
      },
      translations: {
        '': {}
      }
    };

    expect(actualFileContent).to.deep.equals(expectedFileContent);
  });
});
