const fs = require('fs');
const babelParser = require('@babel/parser');
const { visit } = require('ast-types');

function filterAstItemsByPropertyName(allItems, propertyNames) {
  return allItems.filter(
    (item) =>
      item.callee &&
      item.callee.property &&
      propertyNames.includes(item.callee.property.name)
  );
}

function getItemText(item, fileName) {
  if (item.value) {
    return item.value;
  }

  if (item.type === 'TemplateLiteral') {
    if (item.quasis.length > 1) {
      throw new Error(
        `You should not use a template literal with variables inside - use l10n placeholders instead: ${fileName}:${item.loc.start.line}:${item.loc.start.column}`
      );
    }

    return item.quasis[0].value.raw;
  }

  throw new Error(
    `You need to pass a string as argument to l10n methods: ${fileName}:${item.loc.start.line}:${item.loc.start.column}`
  );
}

function parseJs(fileName, astItems, gettextItems) {
  filterAstItemsByPropertyName(astItems, ['t']).forEach((item) => {
    if (item.arguments.length < 1) {
      throw new Error(
        `t() invocation does not seem to have proper arguments: ${fileName}:${item.loc.start.line}:${item.loc.start.column}`
      );
    }

    let messageId = getItemText(item.arguments[0], fileName);
    let loc = {
      fileName,
      line: item.loc.start.line,
      column: item.loc.start.column,
    };

    gettextItems.push({
      messageId,
      loc,
    });
  });

  filterAstItemsByPropertyName(astItems, ['pt']).forEach((item) => {
    if (item.arguments.length < 2) {
      throw new Error(
        `pt() invocation does not seem to have proper arguments: ${fileName}:${item.loc.start.line}:${item.loc.start.column}`
      );
    }

    let messageId = getItemText(item.arguments[0], fileName);
    let messageContext = getItemText(item.arguments[1], fileName);
    let loc = {
      fileName,
      line: item.loc.start.line,
      column: item.loc.start.column,
    };

    gettextItems.push({
      messageId,
      messageContext,
      loc,
    });
  });

  filterAstItemsByPropertyName(astItems, ['n']).forEach((item) => {
    if (item.arguments.length < 3) {
      throw new Error(
        `n() invocation does not seem to have proper arguments: ${fileName}:${item.loc.start.line}:${item.loc.start.column}`
      );
    }

    let messageId = getItemText(item.arguments[0], fileName);
    let messageIdPlural = getItemText(item.arguments[1], fileName);
    let loc = {
      fileName,
      line: item.loc.start.line,
      column: item.loc.start.column,
    };

    gettextItems.push({
      messageId,
      messageIdPlural,
      loc,
    });
  });

  filterAstItemsByPropertyName(astItems, ['pn']).forEach((item) => {
    if (item.arguments.length < 4) {
      throw new Error(
        `pn() invocation does not seem to have proper arguments: ${fileName}:${item.loc.start.line}:${item.loc.start.column}`
      );
    }

    let messageId = getItemText(item.arguments[0], fileName);
    let messageIdPlural = getItemText(item.arguments[1], fileName);
    let messageContext = getItemText(item.arguments[3], fileName);
    let loc = {
      fileName,
      line: item.loc.start.line,
      column: item.loc.start.column,
    };

    gettextItems.push({
      messageId,
      messageIdPlural,
      messageContext,
      loc,
    });
  });

  return gettextItems;
}

function parseJsFile(file, options, gettextItems) {
  let encoding = options.fromCode.toLowerCase();

  let data = fs.readFileSync(file, encoding);
  let astItems = [];

  let parserOptions = {
    range: false,
    loc: true,
    sourceType: 'module',
    // See: https://babeljs.io/docs/en/babel-parser
    plugins: [
      'classProperties',
      'asyncGenerators',
      'dynamicImport',
      'decorators-legacy',
      'classPrivateProperties',
      'classPrivateMethods',
      'nullishCoalescingOperator',
      'optionalChaining',
      'typescript',
      'objectRestSpread',
    ],
  };
  let ast = babelParser.parse(data, parserOptions);

  visit(ast, {
    visitCallExpression(path) {
      let { node } = path;
      astItems.push(node);
      this.traverse(path);
    },
  });

  return parseJs(file, astItems, gettextItems);
}

module.exports = {
  parseJsFile,
};
