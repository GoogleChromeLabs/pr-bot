/**
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
class PluginInterface {
  constructor(pluginName) {
    if (!pluginName) {
      throw new Error('You must define a plugin name.');
    }
    this._pluginName = pluginName;
  }

  get name() {
    return this._pluginName;
  }

  createLogTable(rows) {
    if (!rows || rows.length === 0) {
      return '';
    }

    let numberOfCols = rows[0].length;
    let columnWidths = [];
    for (let i = 0; i < numberOfCols; i++) {
      columnWidths.push(0);
    }

    rows.forEach((row) => {
      for (let i = 0; i < numberOfCols; i++) {
        let rowEntry = row[i];
        if (rowEntry.length > columnWidths[i]) {
          columnWidths[i] = rowEntry.length;
        }
      }
    });

    const rowStrings = rows.map((row) => {
      const rowStrings = [];
      for (let i = 0; i < numberOfCols; i++) {
        let rowEntry = row[i];
        rowStrings.push(
          this._padWithSpaces(rowEntry, columnWidths[i])
        );
      }
      return rowStrings.join('  ').trim();
    });

    return rowStrings.join('\n');
  }

  createMDTable(headings, rows) {
    if (!rows || rows.length === 0) {
      return '';
    }

    let numberOfCols = headings.length;
    let columnWidths = [];
    for (let i = 0; i < numberOfCols; i++) {
      columnWidths.push(0);
    }

    let headingString = `| ${headings.join(' | ')} |`;
    let headingEnd = `|${' --- |'.repeat(numberOfCols)}`;

    rows.forEach((row) => {
      for (let i = 0; i < numberOfCols; i++) {
        let rowEntry = row[i];
        if (rowEntry.length > columnWidths[i]) {
          columnWidths[i] = rowEntry.length;
        }
      }
    });

    const joinedRows = rows.map((row) => {
      const rowStrings = [];
      for (let i = 0; i < numberOfCols; i++) {
        let rowEntry = row[i];
        rowStrings.push(
          this._padWithSpaces(rowEntry, columnWidths[i])
        );
      }
      return `| ${rowStrings.join(' | ').trim()} |`;
    }).join('\n');
    return [headingString, headingEnd, joinedRows].join('\n');
  }

  _padWithSpaces(string, requiredWidth) {
    return string + ' '.repeat(requiredWidth - string.length);
  }
}

module.exports = PluginInterface;
