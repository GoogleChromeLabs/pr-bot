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
const GitHubApi = require('github');
const logHelper = require('../utils/log-helper');

class GithubController {
  constructor({owner, repo}) {
    const token = process.env['GITHUB_TOKEN'];
    if (!token) {
      logHelper.error(`No 'GITHUB_TOKEN' environment variable defined.`);
      throw new Error(`No 'GITHUB_TOKEN' environment variable defined.`);
    }

    this._github = new GitHubApi();
    // Can this be type of 'token' ?
    this._github.authenticate({
      type: 'oauth',
      token: token,
    });

    this._owner = owner;
    this._repo = repo;
  }

  /**
   * Pull requests are treated as issues by the Github API.
   */
  postIssueComment({number, comment}) {
    return this._github.issues.createComment({
      owner: this._owner,
      repo: this._repo,
      number,
      body: comment
    });
  }

  /**
   * This will show up in PR's as the current state (same place as Travis
   * status can block a PR.)
   */
  postState({sha, state}) {
    return this._github.repos.createStatus({
      owner: this._owner,
      repo: this._repo,
      sha: sha,
      state,
      context: 'PR-Bot',
      description: 'All PR-Bot plugins passed the build.'
    });
  }

  /**
   * Get the details for a specific PR
   */
  getPRDetails({number}) {
    return this._github.pullRequests.get({
      owner: this._owner,
      repo: this._repo,
      number,
    });
  }

  getRepoDetails() {
    return this._github.repos.get({
      owner: this._owner,
      repo: this._repo,
    });
  }

  getBranchDetails({branch}) {
    return this._github.repos.getBranch({
      owner: this._owner,
      repo: this._repo,
      branch,
    });
  }

  deletePreviousIssueComments({number, botName}) {
    return this._github.issues.getComments({
      owner: this._owner,
      repo: this._repo,
      number,
    })
    .then((issueCommentsData) => {
      const issueComments = issueCommentsData.data;
      const botIssues = issueComments.filter((issueComment) => {
        return (issueComment.user.login === botName);
      });
      const deletePromises = botIssues.map((botIssue) => {
        return this._github.issues.deleteComment({
          id: botIssue.id,
          owner: this._owner,
          repo: this._repo,
        });
      });
    });
  }
}

module.exports = GithubController;
