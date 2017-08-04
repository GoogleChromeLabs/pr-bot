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
const expect = require('chai').expect;
const sinon = require('sinon');
const path = require('path');
const proxyquire = require('proxyquire');
const SizePlugin = require('../../../src/plugins/size');

describe('plugins.Size', function() {
  it('should get name', function() {
    const plugin = new SizePlugin();
    expect(plugin.name).to.exist;
  });

  it('should throw when no globPattern', function() {
    expect(() => {
      const plugin = new SizePlugin();
      return plugin.run()
    }).to.throw(`requires a 'globPattern'`);
  });

  it('should reject on glob error', function() {
    const injectedError = new Error('Inject test error.');
    const SizePlugin = proxyquire('../../../src/plugins/size', {
      'glob': (pattern, opts, cb) => {
        cb(injectedError)
      }
    });
    const sizePlugin = new SizePlugin({
        globPattern: '**/*',
      });
    return sizePlugin.run()
    .then(() => {
      throw new Error('Expected run to throw an injected error.');
    }, (err) => {
      expect(err).to.equal(injectedError);
    });
  });

  it('should mark file changes', function() {
    const plugin = new SizePlugin({
      globPattern: '**/*',
    });
    return plugin.run({
      beforePath: path.join(__dirname, '..', '..', 'static', 'size-example-before'),
      afterPath: path.join(__dirname, '..', '..', 'static', 'size-example-after'),
    })
    .then((results) => {
      expect(results.prettyLog).to.exist;

      console.log(results.prettyLog);

      // Print all logs when nothings changed.
      const cleanLog = results.prettyLog.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        '');
      expect(cleanLog).to.equal(`
Changed File Sizes
------------------
content-to-empty.txt  45 B        >  0 B         -100.00%
dino.jpg              268.633 KB  >  104.004 KB  -61.28%
empty-to-content.txt  0 B         >  38 B        +Infinity%
minor-change.txt      7.126 KB    >  7.125 KB    -0.01%
stays-the-same.txt    29 B        >  50 B        +72.41%

New Files
---------
new-file.txt  21 B
`);

      expect(results.markdownLog).to.exist;

      console.log(results.markdownLog);

      expect(results.markdownLog).to.equal(`#### Changed File Sizes

| File | Before | After | Change |  |
| --- | --- | --- | --- | --- |
| content-to-empty.txt | 45 B       | 0 B        | -100.00%   | 🎉 |
| dino.jpg             | 268.633 KB | 104.004 KB | -61.28%    | 🎉 |
| empty-to-content.txt | 0 B        | 38 B       | +Infinity% | ☠️ |
| minor-change.txt     | 7.126 KB   | 7.125 KB   | -0.01%     | |
| stays-the-same.txt   | 29 B       | 50 B       | +72.41%    | ☠️ |

#### New Files

| File | Size |
| --- | --- |
| new-file.txt | 21 B |

#### All File Sizes

<details>
<summary>View Table</summary>

| File | Before | After | Change |  |
| --- | --- | --- | --- | --- |
| content-to-empty.txt | 45 B       | 0 B        | -100.00%   | 🎉 |
| dino.jpg             | 268.633 KB | 104.004 KB | -61.28%    | 🎉 |
| empty-to-content.txt | 0 B        | 38 B       | +Infinity% | ☠️ |
| empty.txt            | 0 B        | 0 B        |            | |
| minor-change.txt     | 7.126 KB   | 7.125 KB   | -0.01%     | |
| new-file.txt         |            | 21 B       |            | |
| stays-the-same.txt   | 29 B       | 50 B       | +72.41%    | ☠️ |

</details>`);
    });
  });

  it('should handle no file changed gracefully', function() {
    const plugin = new SizePlugin({
      globPattern: '**/*',
    });
    return plugin.run({
      beforePath: path.join(__dirname, '..', '..', 'static', 'size-example-after'),
      afterPath: path.join(__dirname, '..', '..', 'static', 'size-example-after'),
    })
    .then((results) => {
      expect(results.prettyLog).to.exist;

      const cleanLog = results.prettyLog.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        '');
      expect(cleanLog).to.equal(`
Changed File Sizes
------------------
No file sizes have changed.

New Files
---------
No new files have been added.
`);

      expect(results.markdownLog).to.exist;

      console.log(results.markdownLog);

      expect(results.markdownLog).to.equal(`#### Changed File Sizes

No file sizes have changed.

#### New Files

No new files have been added.

#### All File Sizes

<details>
<summary>View Table</summary>

| File | Before | After | Change |  |
| --- | --- | --- | --- | --- |
| content-to-empty.txt | 0 B        | 0 B        |       | |
| dino.jpg             | 104.004 KB | 104.004 KB | 0.00% | |
| empty-to-content.txt | 38 B       | 38 B       | 0.00% | |
| empty.txt            | 0 B        | 0 B        |       | |
| minor-change.txt     | 7.125 KB   | 7.125 KB   | 0.00% | |
| new-file.txt         | 21 B       | 21 B       | 0.00% | |
| stays-the-same.txt   | 50 B       | 50 B       | 0.00% | |

</details>`);
    });
  })

  it('should return 1KB', function() {
    const result = SizePlugin._convertSize(1000);
    expect(result).to.deep.equal({
      size: 1,
      unit: 'KB',
    });
  });

  it('should return 1.5KB', function() {
    const result = SizePlugin._convertSize(1500);
    expect(result).to.deep.equal({
      size: 1.5,
      unit: 'KB',
    });
  });

  it('should return 1MB', function() {
    const result = SizePlugin._convertSize(1000000);
    expect(result).to.deep.equal({
      size: 1,
      unit: 'MB',
    });
  });

  it('should return 1.5MB', function() {
    const result = SizePlugin._convertSize(1500000);
    expect(result).to.deep.equal({
      size: 1.5,
      unit: 'MB',
    });
  });
});
