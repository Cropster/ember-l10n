const fs = require('fs');
const { preprocess } = require('@glimmer/syntax');

function findAstItems(astBody) {
  let allItems = [];
  astBody.forEach((item) => flattenAstItem(item, allItems));

  return allItems;
}

function flattenAstItem(item, allItems = []) {
  allItems.push(item);

  if (item.children) {
    item.children.forEach((item) => flattenAstItem(item, allItems));
  }

  if (item.body) {
    item.body.forEach((item) => flattenAstItem(item, allItems));
  }

  if (item.params) {
    item.params.forEach((item) => flattenAstItem(item, allItems));
  }

  if (item.program && item.program.body) {
    item.program.body.forEach((item) => flattenAstItem(item, allItems));
  }

  if (item.inverse && item.inverse.body) {
    item.inverse.body.forEach((item) => flattenAstItem(item, allItems));
  }

  if (item.hash && item.hash.pairs) {
    item.hash.pairs.forEach((hashPair) =>
      flattenAstItem(hashPair.value, allItems)
    );
  }

  if (item.attributes) {
    item.attributes.forEach((attributeItem) =>
      flattenAstItem(attributeItem.value, allItems)
    );
  }

  if (item.parts) {
    item.parts.forEach((item) => flattenAstItem(item, allItems));
  }

  return allItems;
}

function filterAstItemsByType(allItems, types) {
  return allItems.filter((item) => types.includes(item.type));
}

function filterAstItemsByPath(allItems, paths) {
  return allItems.filter(
    (item) => item.path && paths.includes(item.path.original)
  );
}

function getItemText(item, fileName) {
  if (item.value) {
    return item.value;
  }

  throw new Error(
    `You need to pass a string as argument to l10n helpers: ${fileName}:${
      item.loc.start.line
    }:${item.loc.start.column}`
  );
}

function parseHbs(fileName, astBody, gettextItems = []) {
  let items = findAstItems(astBody);
  let filteredItems = filterAstItemsByType(items, [
    'MustacheStatement',
    'SubExpression'
  ]);

  filterAstItemsByPath(filteredItems, ['t']).forEach((item) => {
    if (item.params.length < 1) {
      throw new Error(
        `t-helper does not seem to have proper arguments: ${fileName}:${
          item.loc.start.line
        }:${item.loc.start.column}`
      );
    }

    let messageId = getItemText(item.params[0], fileName);
    let loc = {
      fileName,
      line: item.loc.start.line,
      column: item.loc.start.column
    };

    gettextItems.push({
      messageId,
      loc
    });
  });

  filterAstItemsByPath(filteredItems, ['pt']).forEach((item) => {
    if (item.params.length < 2) {
      throw new Error(
        `pt-helper does not seem to have proper arguments: ${fileName}:${
          item.loc.start.line
        }:${item.loc.start.column}`
      );
    }

    let messageId = getItemText(item.params[0], fileName);
    let messageContext = getItemText(item.params[1], fileName);
    let loc = {
      fileName,
      line: item.loc.start.line,
      column: item.loc.start.column
    };

    gettextItems.push({
      messageId,
      messageContext,
      loc
    });
  });

  filterAstItemsByPath(filteredItems, ['n']).forEach((item) => {
    if (item.params.length < 3) {
      throw new Error(
        `n-helper does not seem to have proper arguments: ${fileName}:${
          item.loc.start.line
        }:${item.loc.start.column}`
      );
    }

    let messageId = getItemText(item.params[0], fileName);
    let messageIdPlural = getItemText(item.params[1], fileName);
    let loc = {
      fileName,
      line: item.loc.start.line,
      column: item.loc.start.column
    };

    gettextItems.push({
      messageId,
      messageIdPlural,
      loc
    });
  });

  filterAstItemsByPath(filteredItems, ['pn']).forEach((item) => {
    if (item.params.length < 4) {
      throw new Error(
        `pn-helper does not seem to have proper arguments: ${fileName}:${
          item.loc.start.line
        }:${item.loc.start.column}`
      );
    }

    let messageId = getItemText(item.params[0], fileName);
    let messageIdPlural = getItemText(item.params[1], fileName);
    let messageContext = getItemText(item.params[3], fileName);
    let loc = {
      fileName,
      line: item.loc.start.line,
      column: item.loc.start.column
    };

    gettextItems.push({
      messageId,
      messageIdPlural,
      messageContext,
      loc
    });
  });
}

function parseHbsFile(file, options, gettextItems) {
  let encoding = options.fromCode.toLowerCase();

  let data = fs.readFileSync(file, encoding);
  let { body: astBody } = preprocess(data);
  return parseHbs(file, astBody, gettextItems);
}

module.exports = {
  parseHbsFile
};
