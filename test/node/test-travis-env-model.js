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
const TravisEnvModel = require('../../src/models/travis-env-model');

describe('travis-env-model', function() {
  it('is not travis', function() {
    delete process.env['TRAVIS'];

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.isTravis).to.equal(false);
  });

  it('is travis', function() {
    process.env['TRAVIS'] = 'true';

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.isTravis).to.equal(true);
  });

  it('is not pull request', function() {
    delete process.env['TRAVIS_EVENT_TYPE'];

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.isPullRequest).to.equal(false);
  });

  it('is not pull request either', function() {
    process.env['TRAVIS_EVENT_TYPE'] = 'push';

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.isPullRequest).to.equal(false);
  });

  it('is pull request', function() {
    process.env['TRAVIS_EVENT_TYPE'] = 'pull_request';

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.isPullRequest).to.equal(true);
  });

  it('no repo details', function() {
    delete process.env['TRAVIS_REPO_SLUG'];

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.repoDetails).to.equal(null);
  });

  it('no repo details either', function() {
    process.env['TRAVIS_REPO_SLUG'] = 'example';

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.repoDetails).to.equal(null);
  });

  it('no repo details as well', function() {
    process.env['TRAVIS_REPO_SLUG'] = 'example/example-two/nope';

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.repoDetails).to.equal(null);
  });

  it('get repo details', function() {
    process.env['TRAVIS_REPO_SLUG'] = 'example-owner/example-repo';

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.repoDetails).to.deep.equal({
      owner: 'example-owner',
      repo: 'example-repo',
    });
  });

  it('no PR sha', function() {
    delete process.env['TRAVIS_PULL_REQUEST_SHA'];

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.pullRequestSha).to.equal(undefined);
  });

  it('get PR sha', function() {
    const injectedSha = '123456789abcde';
    process.env['TRAVIS_PULL_REQUEST_SHA'] = injectedSha;

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.pullRequestSha).to.equal(injectedSha);
  });

  it('no PR number', function() {
    delete process.env['TRAVIS_PULL_REQUEST'];

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.pullRequestNumber).to.equal(undefined);
  });

  it('get PR number', function() {
    const injectedPR = '123456';
    process.env['TRAVIS_PULL_REQUEST'] = injectedPR;

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.pullRequestNumber).to.equal(injectedPR);
  });

  it('no test results', function() {
    delete process.env['TRAVIS_TEST_RESULT'];

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.isSuccessfulTravisRun).to.equal(undefined);
  });

  it('bad test results', function() {
    process.env['TRAVIS_TEST_RESULT'] = '1';

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.isSuccessfulTravisRun).to.equal(false);
  });

  it('good test results', function() {
    process.env['TRAVIS_TEST_RESULT'] = '0';

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.isSuccessfulTravisRun).to.equal(true);
  });

  it('should return undefined for no git branch', function() {
    delete process.env['TRAVIS_BRANCH'];

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.gitBranch).to.equal(undefined);
  });

  it('should return git branch', function() {
    const branch = 'my-random-branch';
    process.env['TRAVIS_BRANCH'] = branch;

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.gitBranch).to.equal(branch);
  });

  it('should return undefined for PR num', function() {
    delete process.env['TRAVIS_PULL_REQUEST'];

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.pullRequestNumber).to.equal(undefined);
  });

  it('should return undefined for PR num === false', function() {
    process.env['TRAVIS_PULL_REQUEST'] = 'false';

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.pullRequestNumber).to.equal(undefined);
  });

  it('should return the PR num', function() {
    const prNum = '123';
    process.env['TRAVIS_PULL_REQUEST'] = prNum;

    const travisEnv = new TravisEnvModel();
    expect(travisEnv.pullRequestNumber).to.equal(prNum);
  });
});
