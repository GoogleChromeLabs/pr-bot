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
const glob = require('glob');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const gzipSize = require('gzip-size');

const PluginInterface = require('./plugin-interface');
const POSITIVE_EMOJI = '✅';
const NEGATIVE_EMOJI = '🚫';

class SizePlugin extends PluginInterface {
  constructor({globPattern, globOptions} = {}) {
    super('PR-Bot Size Plugin');

    this._globPattern = globPattern;
    this._globOptions = globOptions;
  }

  run({beforePath, afterPath} = {}) {
    if (!this._globPattern) {
      throw new Error(`The '${this.name}' requires a ` +
        `'globPattern' parameter in the constructor.`);
    }

    return Promise.all([
      this._getFileDetails(beforePath),
      this._getFileDetails(afterPath),
    ])
    .then((results) => {
      const beforeFiles = results[0];
      const afterFiles = results[1];

      const newFileList = [];

      Object.keys(afterFiles).forEach((relativePathKey) => {
        const fileDetails = afterFiles[relativePathKey];

        const afterDetails = afterFiles[relativePathKey];
        const beforeDetails = beforeFiles[relativePathKey];

        // If there was a previous file but it's size was 0,
        // treat it as a new file (avoids the divide by zero issue with)
        // calculating sizeDiff
        fileDetails.isNewFile = (typeof beforeDetails === 'undefined');

        if (!fileDetails.isNewFile) {
          fileDetails.previousSize = beforeDetails.sizeInBytes;
          fileDetails.sizeDifferenceInBytes =
            afterDetails.sizeInBytes - beforeDetails.sizeInBytes;
          fileDetails.sizeDifferencePercent =
              (afterDetails.sizeInBytes / beforeDetails.sizeInBytes) - 1;
        } else {
          fileDetails.previousSize = null;
          fileDetails.sizeDifferenceInBytes = NaN;
          fileDetails.sizeDifferencePercent = NaN;
        }

        newFileList.push(fileDetails);
      });

      return newFileList;
    })
    .then((allFileInfo) => {
      return {
        prettyLog: this.getPrettyLogResults(allFileInfo),
        markdownLog: this.getMarkdownResults(allFileInfo),
      };
    });
  }

  _getFileDetails(directory) {
    return new Promise((resolve, reject) => {
      const globOptions = this._globOptions || {};
      globOptions.absolute = true;
      globOptions.cwd = directory;
      globOptions.root = directory;

      glob(this._globPattern, globOptions, (err, matches) => {
        if (err) {
          return reject(err);
        }
        resolve(matches);
      });
    })
    .then((filePaths) => {
      return filePaths.reduce((promiseChain, filePath) => {
        return promiseChain.then((fileInfo) => {
          return fs.stat(filePath)
          .then((stats) => {
            const fileContents = fs.readFileSync(filePath);
            const gzippedSize = gzipSize.sync(fileContents);
            const relativePath = path.relative(directory, filePath);
            fileInfo[relativePath] = {
              relativePath,
              sizeInBytes: stats.size,
              gzipSizeInBytes: gzippedSize,
            };
            return fileInfo;
          });
        });
      }, Promise.resolve({}));
    });
  }

  static _convertSize(sizeInBytes) {
    if (typeof sizeInBytes !== 'number') {
      return null;
    }

    let fileSize = sizeInBytes;
    let unit = 'B';
    if (fileSize >= 1000) {
      unit = 'KB';
      fileSize = fileSize / 1000;

      if (fileSize >= 1000) {
        unit = 'MB';
        fileSize = fileSize / 1000;
      }
    }

    return {
      size: fileSize,
      unit,
    };
  }

  getPrettyLogResults(allFileInfo) {
    let changedFileInfo = allFileInfo.filter((fileInfo) => {
      return fileInfo.isNewFile === false && (fileInfo.sizeDifferenceInBytes !== 0);
    });

    const changedFileRows = changedFileInfo.map((fileInfo) => {
      const newSizeDetails = SizePlugin._convertSize(fileInfo.sizeInBytes);
      const prevSizeDetails = SizePlugin._convertSize(fileInfo.previousSize);

      let percentChangeColor = chalk.dim;
      if (fileInfo.sizeDifferencePercent >= 0.1) {
        percentChangeColor = chalk.red;
      } else if (fileInfo.sizeDifferencePercent <= -0.1) {
        percentChangeColor = chalk.green;
      }

      let prettyFloat = parseFloat(fileInfo.sizeDifferencePercent * 100)
        .toFixed(2);
        let prefix = '';
        if (fileInfo.sizeDifferencePercent > 0) {
          prefix = '+';
        }
      let percentString = percentChangeColor(`${prefix}${prettyFloat}%`);

      const prevSize = parseFloat(prevSizeDetails.size).toFixed(2);
      const newSize = parseFloat(newSizeDetails.size).toFixed(2);

      return [
        chalk.yellow(fileInfo.relativePath),
        chalk.dim(`${prevSize} ${prevSizeDetails.unit}`),
        chalk.dim(`>`),
        chalk.blue(`${newSize} ${newSizeDetails.unit}`),
        percentString
      ];
    });

    let newFileInfo = allFileInfo.filter((fileInfo) => {
      return fileInfo.isNewFile;
    });

    let newFileRows = newFileInfo.map((fileInfo) => {
      const newSizeDetails = SizePlugin._convertSize(fileInfo.sizeInBytes);

      const newSize = parseFloat(newSizeDetails.size).toFixed(2);

      return [
        chalk.yellow(fileInfo.relativePath),
        chalk.blue(`${newSize} ${newSizeDetails.unit}`),
      ];
    });

    let changedTable = this.createLogTable(changedFileRows);
    let newTable = this.createLogTable(newFileRows);

    if (!changedTable) {
      changedTable = 'No file sizes have changed.';
    }

    if (!newTable) {
      newTable = 'No new files have been added.';
    }

    const changedTitle = 'Changed File Sizes';
    const changedTitleBar = '-'.repeat(changedTitle.length)
    const allChangedTable = [changedTitle, changedTitleBar, changedTable]
      .join('\n');

    const newTitle = 'New Files';
    const newTitleBar = '-'.repeat(newTitle.length)
    const allNewTable = [newTitle, newTitleBar, newTable]
      .join('\n');

    return '\n' + [allChangedTable, allNewTable].join('\n\n') + '\n';
  }

  getMarkdownResults(allFileInfo) {
    let changedHeadings = [
      'File',
      'Before',
      'After',
      'Change',
      'GZipped',
      ''
    ];

    let changedFileInfo = allFileInfo.filter((fileInfo) => {
      return fileInfo.isNewFile === false && (fileInfo.sizeDifferenceInBytes !== 0);
    });

    const changedFileRows = this._getMDFileRows(changedFileInfo);
    const fullFileRows = this._getMDFileRows(allFileInfo);

    let newHeadings = [
      'File',
      'Size',
      'GZipped'
    ];

    let newFileInfo = allFileInfo.filter((fileInfo) => {
      return fileInfo.isNewFile;
    });

    let newFileRows = newFileInfo.map((fileInfo) => {
      const newSizeDetails = SizePlugin._convertSize(fileInfo.sizeInBytes);
      const newGZipDetails = SizePlugin._convertSize(fileInfo.gzipSizeInBytes);

      const newSize = parseFloat(newSizeDetails.size).toFixed(2);
      const newGzipSize = parseFloat(newGZipDetails.size).toFixed(2);

      return [
        fileInfo.relativePath,
        `${newSize} ${newSizeDetails.unit}`,
        `${newGzipSize} ${newGZipDetails.unit}`
      ];
    });

    let changedTable = this.createMDTable(changedHeadings, changedFileRows);
    let newTable = this.createMDTable(newHeadings, newFileRows);
    let fullTable = this.createMDTable(changedHeadings, fullFileRows);

    if (!changedTable) {
      changedTable = 'No file sizes have changed.';
    }

    if (!newTable) {
      newTable = 'No new files have been added.';
    }

    return `#### Changed File Sizes

${changedTable}

#### New Files

${newTable}

#### All File Sizes

<details>
<summary>View Table</summary>

${fullTable}

</details>`;
  }

  _getMDFileRows(fileDetails) {
    return fileDetails.map((fileInfo) => {
      const newSizeDetails = SizePlugin._convertSize(fileInfo.sizeInBytes);
      const newGzipDetails = SizePlugin._convertSize(fileInfo.gzipSizeInBytes);
      const prevSizeDetails = SizePlugin._convertSize(fileInfo.previousSize);

      let percentString = '';
      if (!isNaN(fileInfo.sizeDifferencePercent)) {
        let prettyFloat = parseFloat(fileInfo.sizeDifferencePercent * 100)
          .toFixed(2);
        let prefix = '';
        if (fileInfo.sizeDifferencePercent > 0) {
          prefix = '+';
        }
        percentString = `${prefix}${prettyFloat}%`;
      }

      let emoji = '';
      if (fileInfo.sizeDifferencePercent > 0.1) {
        emoji = '☠️';
      } else if(fileInfo.sizeDifferencePercent < -0.1) {
        emoji = '🎉';
      }

      const newSize = parseFloat(newSizeDetails.size).toFixed(2);
      const newGzipSize = parseFloat(newGzipDetails.size).toFixed(2);

      return [
        fileInfo.relativePath,
        prevSizeDetails ? `${parseFloat(prevSizeDetails.size).toFixed(2)} ${prevSizeDetails.unit}` : '',
        `${newSize} ${newSizeDetails.unit}`,
        percentString,
        `${newGzipSize} ${newGzipDetails.unit}`,
        emoji
      ];
    });
  }
}

module.exports = SizePlugin;
