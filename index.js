'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const CreateEmberL10nFastBootAssetMap = require('./lib/utils/create-fastboot-asset-map');

const MetaPlaceholder = '__ember-l10n__LocaleAssetMapPlaceholder__';
const fastbootAssetMapModulePath = 'ember-l10n/fastboot-locale-asset-map.js';

module.exports = {
  name: require('./package').name,

  includedCommands() {
    return {
      'l10n:install': require('./lib/commands/install'),
      'l10n:extract': require('./lib/commands/extract'),
      'l10n:convert': require('./lib/commands/convert'),
      'l10n:sync': require('./lib/commands/sync')
    };
  },

  included() {
    this._super.included.apply(this, arguments);

    let app = this._findHost();

    let hasEmberCliFastboot = !!this.project.findAddonByName(
      'ember-cli-fastboot'
    );
    this._hasEmberCliFastboot = hasEmberCliFastboot;

    let env = process.env.EMBER_ENV;
    let l10nConfig = this.project.config(env)['ember-l10n'] || {};

    this._localeAssetDirectoryPath = l10nConfig.jsonPath || 'assets/locales';

    // Fix fingerprinting options to work
    if (
      app.options &&
      app.options.fingerprint &&
      app.options.fingerprint.enabled
    ) {
      let fingerprintOptions = app.options.fingerprint;

      let infoMessages = [];

      // Ensure .json files are fingerprinted
      if (!fingerprintOptions.extensions) {
        // ['js', 'css', 'png', 'jpg', 'gif', 'map'] is the default, we add json to it
        fingerprintOptions.extensions = [
          'js',
          'css',
          'png',
          'jpg',
          'gif',
          'map',
          'json'
        ];
        infoMessages.push(
          "set fingerprint.extensions = ['js', 'css', 'png', 'jpg', 'gif', 'map', 'json']"
        );
      } else if (!fingerprintOptions.extensions.includes('json')) {
        fingerprintOptions.extensions.push('json');
        infoMessages.push("added 'json' to fingerprint.extensions");
      }

      // Ensure package.json is NOT fingerprinted (this is added by fastboot)
      let excluded = fingerprintOptions.exclude || [];
      fingerprintOptions.exclude = excluded;

      if (hasEmberCliFastboot && !excluded.includes('package.json')) {
        excluded.push('package.json');
        infoMessages.push("added 'package.json' to fingerprint.exclude");
      }

      if (
        hasEmberCliFastboot &&
        !excluded.includes('**/fastboot-locale-asset-map.{js,map}')
      ) {
        excluded.push('**/fastboot-locale-asset-map,{js,map}');
        infoMessages.push(
          "added '**/fastboot-locale-asset-map.{js,map}' to fingerprint.exclude"
        );
      }

      if (infoMessages.length > 0) {
        this.ui.writeLine('');
        this.ui.writeLine(
          chalk.bold(
            'ember-l10n automatically adjusted the fingerprinting settings to work properly:'
          )
        );
        infoMessages.forEach((message) =>
          this.ui.writeLine(chalk.dim(`* ${message}`))
        );
        this.ui.writeLine('');
      }
    }
  },

  postprocessTree(type, tree) {
    if (type === 'all' && this._hasEmberCliFastboot) {
      // Parse the output tree, get the locale files and build /ember-l10n/fastboot-locale-asset-map.js from it
      // This is all done in a custom Broccoli Plugin
      return new CreateEmberL10nFastBootAssetMap(tree, {
        localeAssetDirectoryPath: this._localeAssetDirectoryPath,
        fastbootAssetMapModulePath
      });
    }

    return tree;
  },

  /**
   * By default, during runtime the l10n service reads the asset map
   * information from a meta tag on the index.html. As we do not have access to
   * global `document` when running in FastBoot, we need to implement a
   * different way to access this asset-map information. See
   * `get-locale-asset-map` where we require the `asset-map` module that is
   * generated in the postBuild() below.
   */
  updateFastBootManifest(manifest) {
    manifest.vendorFiles.push(fastbootAssetMapModulePath);

    return manifest;
  },

  contentFor(type, config) {
    if (type !== 'head' || config._emberL10nContentForInvoked) {
      return;
    }

    // To prevent the tag of being included multiple times, e.g. when used in engines
    config._emberL10nContentForInvoked = true;
    return `<meta name="ember-l10n:localeAssetMap" content="${MetaPlaceholder}">`;
  },

  postBuild(build) {
    this._super.postBuild.apply(this, arguments);

    let fingerprintPrepend = '/';
    let localeAssetDirectoryPath = this._localeAssetDirectoryPath;

    let dirPath = path.join(build.directory, localeAssetDirectoryPath);
    let files = fs.readdirSync(dirPath);

    // Prepend the URL of the asset with the location defined in fingerprint options.
    let fingerprintOptions =
      this.app && this.app.options && this.app.options.fingerprint;

    if (
      fingerprintOptions &&
      fingerprintOptions.enabled &&
      fingerprintOptions.prepend
    ) {
      fingerprintPrepend = this.app.options.fingerprint.prepend;
    }

    let fullFilePaths = files.map((assetFileName) => {
      return [fingerprintPrepend, localeAssetDirectoryPath, assetFileName]
        .map((pathPart) => {
          // Remove trailing slashes to avoid double slashes when joining
          return pathPart.replace(/\/$/, '');
        })
        .join('/');
    });

    let assetMap = {};
    fullFilePaths.forEach((assetFilePath) => {
      let fileName = path.basename(assetFilePath, '.json');

      // Extract locale without fingerprint
      // This works e.g. for 'en', as well as for 'en-XXXXXXXXXXX'
      let [localeName] = fileName.split('-');

      assetMap[localeName] = assetFilePath;
    });

    // Replace in all HTML Files (e.g. when using Prember, there could be multiple files)
    replacePlaceholderInDirectory(build.directory, assetMap);
  }
};

function replacePlaceholderInDirectory(dir, assetMap) {
  let filePaths = fs.readdirSync(dir);

  filePaths.forEach((filePath) => {
    let fullPath = path.join(dir, filePath);
    if (fs.statSync(fullPath).isDirectory()) {
      replacePlaceholderInDirectory(fullPath, assetMap);
      return;
    }

    if (path.extname(fullPath) === '.html') {
      replacePlaceholder(fullPath, assetMap);
    }
  });
}

function replacePlaceholder(filePath, assetMap) {
  let assetMapString = encodeURIComponent(JSON.stringify(assetMap));
  let fileBody = fs.readFileSync(filePath, { encoding: 'utf-8' });
  fs.writeFileSync(filePath, fileBody.replace(MetaPlaceholder, assetMapString));
}
