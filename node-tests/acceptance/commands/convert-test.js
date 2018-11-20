const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const rimraf = require('rimraf');
const Command = require('ember-cli/lib/models/command');
const MockUI = require('console-ui/mock'); // eslint-disable-line
const ConvertCommand = require('./../../../lib/commands/convert');

function getOptions(options = {}) {
  return Object.assign({
    convertFrom: './tmp/ember-l10n-tests',
    convertTo: './tmp/ember-l10n-tests',
    language: 'en',
    validateThrow: null,
    dryRun: false
  }, options);
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

    shell.mkdir('-p', tmpDir)
  });

  afterEach(function() {
    rimraf.sync(tmpDir);
  });

  function createCommand(options = {}) {
    Object.assign(options, {
      ui: new MockUI(),
      project: project,
      environment: {},
      settings: {}
    });

    let TestCommand = Command.extend(ConvertCommand);
    return new TestCommand(options);
  }

  it('it correctly converts a po file', async function() {
    let options = getOptions({});

    // First put the example en.po in the output folder
    fs.copyFileSync('./node-tests/fixtures/convert/en.po', `${options.convertFrom}/en.po`);

    let cmd = createCommand();
    await cmd.run(options);

    let actualFileContent = readJSONFromFile('./tmp/ember-l10n-tests/en.json');
    let expectedFileContent = readJSONFromFile('./node-tests/fixtures/convert/expected.json');

    expect(actualFileContent).to.deep.equals(expectedFileContent);
  });

});
