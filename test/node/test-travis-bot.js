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
const sinon = require('sinon');
const path = require('path');
const proxyquire = require('proxyquire');
const expect = require('chai').expect;

class FakeGithubController {
  getRepoDetails() {
    return Promise.resolve({
      data: {
        clone_url: 'http://fake-url.from/fake-github-controller'
      }
    });
  }
  postIssueComment(options) {
    console.log(options);
  }
}

const TravisBot = proxyquire('../../src/controllers/bot-runner.js', {
  './github-controller': FakeGithubController,
  'child_process': {
    execSync: (command) => {
      console.log(`Running fake execSync command: '${command}'`);
    }
  }
});

describe('bot-runner', function() {
  let stubs = [];

  afterEach(function() {
    stubs.forEach((stub) => {
      stub.restore();
    });
    stubs = [];

    delete process.env['TRAVIS'];
    delete process.env['TRAVIS_EVENT_TYPE'];
    delete process.env['TRAVIS_PULL_REQUEST'];
    delete process.env['TRAVIS_REPO_SLUG'];
  });

  it('should instantiate Travis Bot', function() {
    new TravisBot();
  });

  it('should error when no repo-details in config or travis', function() {
    const bot = new TravisBot({
      configPath: path.join(__dirname, '../static/no-repo-details.config.js')
    });

    return bot.run()
    .then(() => {
      throw new Error('Expected error to be thrown due to no repo details');
    }, (err) => {
      expect(err.message.indexOf(`Unable to get the Github 'repoDetails'`))
        .to.not.equal(-1);
    });
  });

  it ('should get repo details from travis', function() {
    process.env['TRAVIS_REPO_SLUG'] = 'gauntface/example-repo';

    const bot = new TravisBot({
      configPath: path.join(__dirname, '../static/no-repo-details.config.js')
    });

    return bot.run();
  })

  it('should instantiate Travis Bot and print to log', function() {
    const bot = new TravisBot({
      configPath: path.join(__dirname, '../static/example.config.js')
    });

    const logSpy = sinon.spy(bot, '_logDebugInfo');

    return bot.run()
    .then(() => {
      expect(logSpy.calledOnce).to.equal(true);
    });
  });

  it('should handle no name plugins', function() {
    const bot = new TravisBot({
      configPath: path.join(__dirname, '../static/no-plugin-name.config.js')
    });

    return bot.run()
    .then(() => {
      throw new Error('Expect bad plugin to throw error.');
    }, (err) => {
      expect(err.message).to.equal('One of the plugins has failed to define a name property. This is required for reporting.');
    });
  });

  it('should handle bad plugins', function() {
    const bot = new TravisBot({
      configPath: path.join(__dirname, '../static/bad-plugin.config.js')
    });

    return bot.run()
    .then(() => {
      throw new Error('Expect bad plugin to throw error.');
    }, (err) => {
      expect(err.message).to.equal(`The 'Bad Plugin will Error.' threw an error while running: 'Inject Error'`);
    });
  });

  it('should handle good custom plugin', function() {
    const bot = new TravisBot({
      configPath: path.join(__dirname, '../static/example-with-plugin.config.js')
    });

    return bot.run();
  });

  it('should try to print to Github', function() {
    process.env['TRAVIS'] = 'true';
    process.env['TRAVIS_EVENT_TYPE'] = 'pull_request';
    process.env['TRAVIS_PULL_REQUEST'] = '123';

    const deleteStub = sinon.stub(FakeGithubController.prototype, 'deletePreviousIssueComments').callsFake((input) => {
      expect(input).to.deep.equal({
        number: '123',
        botName: 'test-bot'
      });
      return Promise.resolve();
    });
    stubs.push(deleteStub);

    const issueStub = sinon.stub(FakeGithubController.prototype, 'postIssueComment').callsFake((input) => {
      expect(input).to.deep.equal({
        number: '123',
        comment: '### Good Plugin.\n\nThis plugin provided no markdown output.\n\n### Good Plugin 2.\n\n`Hello  from good plugin.`\n\n',
      });
      return Promise.resolve();
    });
    stubs.push(issueStub);

    const bot = new TravisBot({
      configPath: path.join(__dirname, '../static/example-with-plugin.config.js')
    });

    return bot.run();
  });

  it('should try to print to Github without deleting previous comments', function() {
    process.env['TRAVIS'] = 'true';
    process.env['TRAVIS_EVENT_TYPE'] = 'pull_request';
    process.env['TRAVIS_PULL_REQUEST'] = '123';

    const issueStub = sinon.stub(FakeGithubController.prototype, 'postIssueComment').callsFake((input) => {
      expect(input).to.deep.equal({
        number: '123',
        comment: '### Good Plugin.\n\nThis plugin provided no markdown output.\n\n### Good Plugin 2.\n\n`Hello  from good plugin.`\n\n'
      });
      return Promise.resolve();
    });
    stubs.push(issueStub);

    const bot = new TravisBot({
      configPath: path.join(__dirname, '../static/example-with-plugin-no-bot-name.config.js')
    });

    return bot.run();
  });

  it('should pull from repo when its a Travis PR', function() {
    process.env['TRAVIS_PULL_REQUEST_SHA'] = '123';

    const bot = new TravisBot({
      configPath: path.join(__dirname, '../static/example-with-plugin.config.js')
    });

    return bot.run();
  });

  it('should handle non-existant config file', function() {
    const bot = new TravisBot({
      configPath: path.join(__dirname, '../static/doesnt-exist.config.js')
    });

    return bot.run()
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      expect(err.message.indexOf('Unable to find the config file')).to.equal(0);
    });
  });

  it('should handle throwing config file', function() {
    const bot = new TravisBot({
      configPath: path.join(__dirname, '../static/throwing.config.js')
    });

    return bot.run()
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      expect(err.message.indexOf('A problem occurred running the config file.')).to.equal(0);
    });
  });

  it('should handle non-returning config file', function() {
    const bot = new TravisBot({
      configPath: path.join(__dirname, '../static/non-returning.config.js')
    });

    return bot.run()
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      expect(err.message).to.equal(`Unable to get the Github 'repoDetails' from Travis environment variable or the configuration file.`);
    });
  });

  it('should be ok building for local folder and tmp master checkout when run locally', function() {
    delete process.env['TRAVIS_PULL_REQUEST_SHA'];

    const bot = new TravisBot({
      configPath: path.join(__dirname, '../static/example-with-plugin.config.js')
    });

    return bot.run();
  });
});
