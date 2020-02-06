const Plugin = require('broccoli-plugin');
const path = require('path');

class CreateEmberL10nFastBootAssetMap extends Plugin {
  constructor(
    inputNode,
    { localeAssetDirectoryPath, fastbootAssetMapModulePath }
  ) {
    super([inputNode], {});
    // This is used to pick the correct files that need to go into the document (e.g. assets/locales)
    this.localeAssetDirectoryPath = localeAssetDirectoryPath;
    // This is the filename of the asset map module to be generated (ember-l10n/fastboot-locale-asset-map.js)
    this.fastbootAssetMapModulePath = fastbootAssetMapModulePath;
  }

  build() {
    // We only support passing in one input path (for simplicity)
    this.inputPath = this.inputPaths[0];

    this.localeAssetMap = {};
    // This adds locale file content to this.localeAssetMap recursively
    this.parseNode(this.inputPath);

    this.createFastBootAssetMapModule();
  }

  parseNode(inputPath) {
    let stat = this.input.statSync(inputPath);

    if (stat.isFile()) {
      this.parseFile(inputPath);
    } else {
      this.parseDirectory(inputPath);
    }
  }

  parseDirectory(inputPath) {
    let outputPath = this._getOutputPath(inputPath);
    if (!this.output.existsSync(outputPath)) {
      this.output.mkdirSync(outputPath);
    }

    let files = this.input.readdirSync(inputPath);
    files.forEach((file) => this.parseNode(path.join(inputPath, file)));
  }

  parseFile(inputPath) {
    let content = this.input.readFileSync(inputPath);
    let outputPath = this._getOutputPath(inputPath);

    let dir = path.dirname(outputPath);
    let isLocaleFile = dir === this.localeAssetDirectoryPath;

    if (isLocaleFile) {
      this._addToLocaleAssetMap(inputPath, outputPath);
    }

    // Ensure file remains in tree
    this.output.writeFileSync(outputPath, content);
  }

  createFastBootAssetMapModule() {
    let fastbootAssetMapModuleDir = path.dirname(
      this.fastbootAssetMapModulePath
    );
    if (!this.output.existsSync(fastbootAssetMapModuleDir)) {
      this.output.mkdirSync(fastbootAssetMapModuleDir);
    }

    this.output.writeFileSync(
      this.fastbootAssetMapModulePath,
      `define('ember-l10n/fastboot-locale-asset-map', [], function () {
          return {
            'default': ${JSON.stringify(this.localeAssetMap)},
            __esModule: true,
          };
        });`
    );
  }

  _getOutputPath(inputPath) {
    return path.relative(this.inputPath, inputPath);
  }

  _addToLocaleAssetMap(inputPath, outputPath) {
    let fileName = path.basename(outputPath, '.json');

    // Extract locale without fingerprint
    // This works e.g. for 'en', as well as for 'en-XXXXXXXXXXX'
    let [localeName] = fileName.split('-');

    this.localeAssetMap[localeName] = this.input.readFileSync(
      inputPath,
      'utf-8'
    );
  }
}

module.exports = CreateEmberL10nFastBootAssetMap;
