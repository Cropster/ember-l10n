function normalizeMsgId(str) {
  if (!str) {
    return '';
  }
  return str
    .replace(/"/gm, '\\"') // Escape "
    .replace(/(\n|(\r\n))[\t ]*/gm, '\n') // Remove leading whitespace after line breaks
    .replace(/[\t ]+/gm, ' ') // Remove duplicate spaces/tabs
    .replace(/\n/gm, '\\n\n')
    .trim(); // trim front & end of spaces
}

function buildPair(key, str) {
  if (str.includes('\n')) {
    return `${key} ""
${str
  .split('\n')
  .map((str) => `"${str}"`)
  .join('\n')}`;
  }

  return `${key} "${str}"`;
}

// Group equal entries together
// The generated groups look like the given gettextItems, only that they have `locs` instead of `loc`
// Where `locs` is an array of `loc` entries, having a `fileName`, `line` and `column`.
function groupGettextItems(gettextItems) {
  return (
    gettextItems
      // filter out items without message id
      .filter((item) => item.messageId)
      // Ensure all fields are normalized
      .map((item) => {
        return Object.assign({}, item, {
          messageId: normalizeMsgId(item.messageId),
          messageContext: normalizeMsgId(item.messageContext),
          messageIdPlural: normalizeMsgId(item.messageIdPlural),
          messageString: normalizeMsgId(item.messageString),
        });
      })
      // Sort them, to ensure the the location list is stable
      .sort((item1, item2) => {
        return (
          item1.loc.fileName.localeCompare(item2.loc.fileName) ||
          item1.loc.line - item2.loc.line
        );
      })
      // Now finally group them together
      .reduce((allGroups, item) => {
        let group = allGroups.find((group) => {
          return (
            group.messageId === item.messageId &&
            group.messageContext === item.messageContext
          );
        });

        if (group) {
          group.locs.push(item.loc);

          // Although it is an edge case, it is possible for two translations to have the same messageID
          // while only one of them has a plural
          // For example: {{t 'Find item'}} {{n 'Find item' 'Find items' count}}
          // For such a case, we make sure to also add the plural, if it was previously missing
          if (!group.messageIdPlural && item.messageIdPlural) {
            group.messageIdPlural = item.messageIdPlural;
          }
        } else {
          group = Object.assign({}, item);
          group.locs = [item.loc];
          delete group.loc;
          allGroups.push(group);
        }

        return allGroups;
      }, [])
  );
}

function buildPotFile(gettextItems, options) {
  let groupedItems = groupGettextItems(gettextItems);

  let items = [
    {
      messageId: '',
      messageString: `Content-Type: text/plain; charset=${options.fromCode.toLowerCase()}`,
      locs: [],
    },
  ].concat(groupedItems);

  return items.map((item) => {
    let parts = [];

    item.locs.forEach((loc) => {
      parts.push(`#: ${loc.fileName}:${loc.line}:${loc.column}`);
    });

    if (item.messageContext) {
      parts.push(buildPair('msgctxt', item.messageContext));
    }

    parts.push(buildPair('msgid', item.messageId));

    if (item.messageIdPlural) {
      parts.push(buildPair('msgid_plural', item.messageIdPlural));
    }

    if (item.messageIdPlural) {
      parts.push(`msgstr[0] ""`);
      parts.push(`msgstr[1] ""`);
    } else {
      parts.push(buildPair('msgstr', item.messageString));
    }

    return parts.join(`
`);
  }).join(`

`);
}

module.exports = {
  buildPotFile,
};
