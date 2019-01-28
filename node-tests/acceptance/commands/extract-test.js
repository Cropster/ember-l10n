const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const rimraf = require('rimraf');
const Command = require('ember-cli/lib/models/command');
const MockUI = require('console-ui/mock'); //eslint-disable-line
const ExtractCommand = require('./../../../lib/commands/extract');

function getOptions(options = {}) {
  return Object.assign(
    {
      defaultLanguage: 'en',
      bugAddress: 'test-email@email.com',
      copyright: 'Test Company',
      fromCode: 'UTF-8',
      language: 'en',
      package: 'Test App',
      version: '1.0',
      extractFrom: './tests/dummy/app',
      includePatterns: [],
      skipPatterns: [],
      skipDependencies: [],
      skipAllDependencies: false,
      generateOnly: false,
      generateTo: null,
      extractTo: './tmp/ember-l10n-tests',
      keys: ['t', 'pt:1,2c', 'n:1,2', 'pn:1,2,4c'],
      potName: 'messages.pot',
      generateFrom: 'messages.pot'
    },
    options
  );
}

function getPoFileContent(filePath) {
  // We want to ignore everything until the first comment
  let fileContent = fs.readFileSync(filePath, 'UTF-8');
  return fileContent.substr(fileContent.indexOf('#: '));
}

describe('extract command', function() {
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

    let TestCommand = Command.extend(ExtractCommand);
    return new TestCommand(options);
  }

  it('messages.po file is correctly generated from scratch', async function() {
    let options = getOptions({});

    let cmd = createCommand();
    await cmd.run(options);

    let expectedFileContent = getPoFileContent(
      './node-tests/fixtures/extract/expected.pot'
    );
    let actualFileContent = getPoFileContent(
      './tmp/ember-l10n-tests/messages.pot'
    );

    expect(actualFileContent).to.equals(expectedFileContent);
  });

  it('messages.po file is correctly updated if one already exists', async function() {
    let options = getOptions({});

    // First put a dummy existing messages.po in the output folder
    fs.copyFileSync(
      './node-tests/fixtures/extract/base.pot',
      `${options.extractTo}/messages.pot`
    );

    let cmd = createCommand();
    await cmd.run(options);

    // We want to ignore everything until the first comment
    let expectedFileContent = getPoFileContent(
      './node-tests/fixtures/extract/expected.pot'
    );
    let actualFileContent = getPoFileContent(
      './tmp/ember-l10n-tests/messages.pot'
    );

    expect(actualFileContent).to.equals(expectedFileContent);
  });

  it('correctly handles --include-patterns & --skip-patterns', async function() {
    let options = getOptions({
      extractFrom: './tests',
      includePatterns: ['dummy/app'],
      skipPatterns: ['services']
    });

    let cmd = createCommand();
    await cmd.run(options);

    let expectedFileContent = getPoFileContent(
      './node-tests/fixtures/extract/expected-without-skipped.pot'
    );
    let actualFileContent = getPoFileContent(
      './tmp/ember-l10n-tests/messages.pot'
    );

    expect(actualFileContent).to.equals(expectedFileContent);
  });
});
