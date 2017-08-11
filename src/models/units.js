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

/**
 * Used to abstract away the display string and decimal places for different
 * units of storage.
 */
module.exports = {
  BYTE: {
    display: 'B',
    decimalPlaces: 0,
  },
  KILOBYTE: {
    display: 'KB',
    decimalPlaces: 2,
  },
  MEGABYTE: {
    display: 'MB',
    decimalPlaces: 2,
  },
};
