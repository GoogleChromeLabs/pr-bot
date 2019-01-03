# pr-bot

[![Build Status](https://travis-ci.org/GoogleChromeLabs/pr-bot.svg?branch=master)](https://travis-ci.org/GoogleChromeLabs/pr-bot) [![Coverage Status](https://coveralls.io/repos/github/GoogleChromeLabs/pr-bot/badge.svg?branch=master)](https://coveralls.io/github/GoogleChromeLabs/pr-bot?branch=master) [![dependencies Status](https://david-dm.org/googlechromelabs/pr-bot/status.svg)](https://david-dm.org/googlechromelabs/pr-bot) [![devDependencies Status](https://david-dm.org/googlechromelabs/pr-bot/dev-status.svg)](https://david-dm.org/googlechromelabs/pr-bot?type=dev)

This is a small utility to run a set of "plugins"
against a Pull Request on Travis and then report
a set of results to GitHub.

![Example PR-Bot Output](http://i.imgur.com/QMOaiQy.png)

## Getting Started

To use `pr-bot` you'll need to set up a few
things:

1. Create a GitHub account to use for bot
activity. This will be the account login and
profile photo that you'll see when the bot
comments on a pull request.

1. Add the GitHub bot account to your project as a collaborator.
`https://github.com/<owner>/<repo>/settings/collaboration`.
Be sure to accept the invite email! This will enable the bot
to set PR statuses.

1. [Create a personal access token for the
GitHub bot account](https://github.com/settings/tokens).
The access token must at least have the `public_repo` scope
enabled.

1. In the Travis settings for your repository,
set the personal access token as an environment
variable called `GITHUB_TOKEN`.

    ![Imgur](http://i.imgur.com/QzwmvxD.png)

1. Add `pr-bot` as a dependency to your
project:

    ```shell
    npm install --save-dev pr-bot
    ```

1. Create a file called `pr-bot.config.js` at the
root of your project (i.e. this file needs to be commited
to your GitHub repository).

1. In this new file add the following:

    ```javascript
    const prbot = require('pr-bot');

    module.exports = {
      botUsername: `<Add the GitHub Username for your Bot Account Here>`,
      repoDetails: {
        owner: "<Add the repo owner, i.e. GoogleChrome>",
        repo: "<Add the repo name, i.e. workbox>"
      },
      plugins: [
        new prbot.plugins.Size({
          globPattern: '**/*.js',
          globOptions: {
            ignore: [
              '**/node_modules/**/*',
            ]
          },
        }),
      ],
    };
    ```

1. Add the following to your `.travis.yml` file

    ```yaml
    after_script:
      - npm install -g pr-bot
      - pr-bot
    ```

Now you can commit your code and if everything is set up correctly, you'll
see comments from your bot account.

![Example output from Size Plugin from pr-bot](http://i.imgur.com/oZPrdXr.png)

### Running Locally

You can see what `pr-bot` will do locally with the following:

```shell
npm install --global pr-bot
GITHUB_TOKEN=<Your bot's personal access token> pr-bot
```

This is useful if you want to see the file differences without
waiting on Travis.

![Example console output from Size Plugin from pr-bot](http://i.imgur.com/h518U9O.png)

### Customising Config Path

You can use the `-c` flag to define a custom config path:

```shell
pr-bot -c ./some-path-my-config.js
```

### Customising Install and Build

If `npm install && npm build` will not suffice for your project,
you define a `buildCommand` parameter in your config file
to define the command to run in the two checkouts of your project.

```javascript
module.exports = {
  // Custom build command in travis.config.js
  buildCommand: `npm install && gulp`,


  botUsername: `....`,
  plugins: [...]
}
```

## How it Works

When you run `pr-bot` it checks out two versions of your project.

1. **If run locally**, it'll checkout the default branch of your repo AND
use the current directory and the current files for the second
version.
1. **If run on Travis**, it'll checkout the base of the Pull Request,
or the target branch, for the first version and it'll checkout the Pull
Request commit as the second version.

These are checked out into tempory files under `/tmp` and `pr-bot`
will `npm install && npm run build` in each repository.

After this, each plugin defined in your config file will be called
with a `beforePath` and `afterPath`. This allows plugins to compare
files or anything else they want.

Plugins are expected to return a `promise` that resolves to an `object`
with a `prettyLog` parameter and a `markdownLog` parameter. The
`prettyLog` is used to display plugin output to the console and
`markdownLog` is used to print to the GitHub comment raised against
the Pull Request.

## Adding Custom Plugins

You can build custom plugins, the key things to note are:

Your plugin must:

1. ..have a `name` property.
1. ..have a `run` method with a signature of
   `run({beforePath, afterPath} = {})`.
1. ..return a Promise from the `run` method.

And your plugin should:

1. ..resolve the `run` promise with an `object`with `prettyLog`
and `markdownLog` string parameters to print out info and if you wish
to mark the Pull Request as a bad PR (set status to failure), you can return
the parameter `failPR` with `true`.

A basic plugin can look like this:

```javascript
{
  name: 'Example Plugin',
  run: () => {
    return Promise.resolve({
      failPR: false,
      prettyLog: 'Hello from example plugin.',
      markdownLog: '## Hello from example plugin.'
    });
  },
}
```

If you want, your custom plugin can also extend the `PluginInterface` from the
module with `const PluginInterface = require('pr-bot').PluginInterface;`.

## Different Base Branch

When developing on a new version, the default branch on GitHub may not be
the branch you want to compare PR's (or locally).

You can compare to other branches using the `overrideBaseBranch` config.

```javascript
module.exports = {
  overrideBaseBranch: '<name of branch',
  ...
};
```
