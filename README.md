# pr-bot

[![Build Status](https://travis-ci.org/GoogleChrome/pr-bot.svg?branch=master)](https://travis-ci.org/GoogleChrome/pr-bot) [![Coverage Status](https://coveralls.io/repos/github/GoogleChrome/pr-bot/badge.svg?branch=master)](https://coveralls.io/github/GoogleChrome/pr-bot?branch=master) [![dependencies Status](https://david-dm.org/googlechrome/pr-bot/status.svg)](https://david-dm.org/googlechrome/pr-bot) [![devDependencies Status](https://david-dm.org/googlechrome/pr-bot/dev-status.svg)](https://david-dm.org/googlechrome/pr-bot?type=dev)

This is a small utility to run a set of "plugins"
against a Pull Request on Travis and then report
a set of results to Github.

## Getting Started

To use `pr-bot` you'll need to set up a few
things:

1. Create a Github account to use for bot
activity. This will be the account login and
profile photo that you'll see when the bot
comments on a pull request.

1. [Create a personal access token for the
Github bot account](https://github.com/settings/tokens).

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
to your Github repository).

1. In this new file add the following:

    ```javascript
    const prbot = require('pr-bot');

    module.exports = {
      botUsername: `<Add the Github Username for your Bot Account Here>`
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

### Running Locally

You can see what `pr-bot` will do locally with the following:

```shell
npm install --global pr-bot
pr-bot
```

This is useful if you want to see the file differences without
waiting on Travis.

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
module.exports {
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
`markdownLog` is used to print to the Github comment raised against
the Pull Request.

## Adding Custom Plugins

You can build custom plugins, the key things to note are:

Your plugin must:

1. ..have a `name` property.
1. ..have a `run` method.
1. ..return a Promise from the `run` method.

And your plugin should:

1. ..resolve the `run` promise with an `object`with `prettyLog`
and `markdownLog` string parameters.
