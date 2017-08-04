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
const chalk = require('chalk');

class LogHelper {
  constructor() {
    this._prefix;
  }

  setPrimaryPrefix(newPrefix) {
    this._prefix = newPrefix;
  }

  _getPrefix(color) {
    if (!this._prefix) {
      return '';
    }

    return color(`[${this._prefix}]:`);
  }

  log() {
    console.log(this._getPrefix(chalk.green), ...arguments);
  }

  warn() {
    console.log(this._getPrefix(chalk.yellow), ...arguments);
  }

  error() {
    console.log(this._getPrefix(chalk.red), ...arguments);
  }

  logKeyValues(keyValues) {
    let longestString = 0;
    const keys = Object.keys(keyValues);
    keys.forEach((keyName) => {
      if (keyName.length > longestString) {
        longestString = keyName.length;
      }
    });

    keys.forEach((keyName) => {
      let spaceString = '  ';
      const spaceLength = longestString - keyName.length;
      for(let i = 0; i < spaceLength; i++) {
        spaceString += ' ';
      }

      this.log(
        '  ' +
        chalk.gray(keyName) +
        spaceString +
        chalk.blue(`'${keyValues[keyName]}'`)
      );
    });
  }
}

module.exports = new LogHelper();
