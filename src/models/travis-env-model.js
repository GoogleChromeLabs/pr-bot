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
class TravisEnvModel {
  get isTravis() {
    return (process.env['TRAVIS'] === 'true');
  }

  get isPullRequest() {
    return (process.env['TRAVIS_EVENT_TYPE'] === 'pull_request');
  }

  get repoDetails() {
    if (!process.env['TRAVIS_REPO_SLUG']) {
      return null;
    }

    const splitSlug = process.env['TRAVIS_REPO_SLUG'].split('/');
    if (splitSlug.length !== 2) {
      return null;
    }

    return {
      owner: splitSlug[0],
      repo: splitSlug[1],
    }
  }

  // The target branch of the pull request OR the current
  // branch that is commited to.
  get gitBranch() {
    return process.env['TRAVIS_BRANCH'];
  }

  get pullRequestSha() {
    return process.env['TRAVIS_PULL_REQUEST_SHA'];
  }

  get pullRequestNumber() {
    if (!process.env['TRAVIS_PULL_REQUEST'] || process.env['TRAVIS_PULL_REQUEST'] === 'false') {
      return undefined;
    }

    return process.env['TRAVIS_PULL_REQUEST'];
  }

  get isSuccessfulTravisRun() {
    const testResult = process.env['TRAVIS_TEST_RESULT'];
    if (typeof testResult === 'undefined') {
      return undefined;
    }

    return (testResult === '0');
  }
}

module.exports = TravisEnvModel;
