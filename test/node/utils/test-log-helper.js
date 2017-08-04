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
const logHelper = require('../../../src/utils/log-helper');
describe('LogHelper', function() {
  it('should warn', function() {
    logHelper.warn('Warning.');
  });

  it('should print key value pairs', function() {
    logHelper.logKeyValues({
      'Example': 'Example Value',
      'a': 'Short Value',
    });
  });
});
