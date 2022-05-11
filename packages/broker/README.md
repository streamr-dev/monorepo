<p align="center">
  <a href="https://streamr.network">
    <img alt="Streamr" src="https://raw.githubusercontent.com/streamr-dev/network-monorepo/main/packages/client/readme-header-img.png" width="1320" />
  </a>
</p>

# streamr-broker

Main executable for running a broker node in Streamr Network.

The broker node extends the minimal network node provided by the
[streamr-network](https://github.com/streamr-dev/network) library with
- client-facing support for foreign protocols (e.g. HTTP, MQTT) via plugins
- support for long-term persistence of data using Apache Cassandra.

## Table of Contents
- [Install](#install)
- [Configure](#configure)
- [Run](#run)
- [Develop](#develop)
- [Release](#release)
- [Misc](#misc)

## Install
| NodeJS version `16.13.x` and NPM version `8.x` is required |
| --- |

To install streamr-broker:
```bash
npm install -g streamr-broker
```

## Configure

To enable the features you want, configure some [plugins](plugins.md).

## Run
When developing the Broker, it is convenient to run it as part of the full Streamr development stack. Check out
the [streamr-docker-dev](https://github.com/streamr-dev/streamr-docker-dev) tool that can be used to run the full stack.

If instead you want to run a broker node by itself without Docker, follow the steps below.

First install the package
```
npm install -g streamr-broker
```
Optionally, create a configuration file with interactive tool:
```
broker-init 
```
Then run the command broker with the desired configuration file
```
broker <configFile>
```
See folder "configs" for example configurations. To run a simple local broker
```
broker configs/development-1.env.json
```
Then run the command tracker with default values
```
tracker
```

### Deleting expired data from Storage node
To delete expired data from storage node run

```
broker <configFile> --deleteExpired
```

or

```
node app.js <configFile> --deleteExpired
```

## Develop

Install dependencies:

    npm ci

Run the tests:

    npm run test

We use [eslint](https://github.com/eslint/eslint) for code formatting:

    npm run eslint

Code coverage:

    npm run coverage

### Debug

To get all debug messages:

    LOG_LEVEL=debug

... or adjust debugging to desired level:

    LOG_LEVEL=[debug|info|warn|error]

To disable all logs

    NOLOG=true

### Regenerate self-signed certificate fixture
To regenerate self-signed certificate in `./test/fixtures` run:

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 36500 -nodes -subj "/CN=localhost"
```

## Release

Publishing to NPM is automated via GitHub Actions. Follow the steps below to publish.

1. `git checkout master && git pull`
2. Update version with either `npm version patch`, `npm version minor`, or `npm version major`. Use semantic versioning
https://semver.org/. Files package.json and package-lock.json will be automatically updated, and an appropriate git commit and tag created.
3. `git push --follow-tags`
4. Wait for GitHub Actions to run tests
5. If tests passed, GitHub Actions will publish the new version to NPM
