# Mary Poppins


![bad photoshop](https://raw.github.com/btford/mary-poppins/master/img/poppins.jpg)

## What's Poppin'?

Mary Poppins is an extensible GitHub bot that keeps your PRs and issues tidy.

See also:
* [haunt](https://github.com/fat/haunt) - A module for creating github issue bots
* [metahub](https://github.com/btford/metahub) - github metadata cache/mirror


## Install

Install `mary-poppins` via `npm`:

```shell
npm install -g mary-poppins
```


## Config

The config file is just JavaScript.
See [`example-config.js`](https://github.com/btford/mary-poppins/blob/master/example-config.js).

To create a new config in the current directory from the example, you can run:
```
mary-poppins init
```

### Plugins

By herself, Mary Poppins don't do anything interesting.
By loading plugins you can give her things to do.


#### Finding Plugins

Search for plugins via `npm`:

```shell
npm search poppins-
```

Some existing plugins are:

* [poppins-pr-checklist](https://github.com/btford/poppins-pr-checklist) - respond to pull requests with a checklist
  - [poppins-check-cla](https://github.com/btford/poppins-check-cla) - check if a user has signed a CLA
  - [poppins-check-commit](https://github.com/btford/poppins-check-commit) - check if the commits follow conventions


#### Installing Plugins

Plugins should be installed locally, in the same directory as the config file.
Plugins are installed with `npm`:

```
npm install poppins-pr-checklist --save
```

Typically you want to save the plugin to `package.json`.

After installing the plugin, you need to load it by calling `poppins.couldYouPlease()` in your config file:

```javascript
// config.js
module.exports = function (poppins) {

  poppins.config = { /*...*/ };

  poppins.couldYouPlease('pr-checklist');
};
```

Alternatively, poppins can load all of the plugins in the `node_modules` directory with `poppins.theUsualPlase()`.

#### Configuring the Plugin

Plugins are configured by adding properties to a `Poppins` object.
By convention, plugins add properties to `poppins.plugins.pluginName`, where `pluginName` corresponds to the name of the plugin.


## Let's get Poppin'

Mary Poppins needs to be hosted somewhere so that Github hooks can send her updates.
I recommend something like [Google Compute Engine](https://cloud.google.com/products/compute-engine),
[Linode](https://www.linode.com/), or [Amazon EC2](http://aws.amazon.com/ec2/).
Any service that allows you to run `node` and gives you a static IP/hostname is fine.

To run Poppins, need to add the appropriate [Github repository hook](http://developer.github.com/v3/repos/hooks/).
The `mary-poppins` CLI can do this for you.
Run:

```shell
mary-poppins install config.js
```

If you need to make changes to the config, uninstall then re-install.

**Note:** You need to use this command to install the hook. Using the web-based panel for hooks
will not set the correct options.

Once Mary Poppins's GitHub hook is installed, you can have her respond to PRs like this:

```shell
mary-poppins start config.js
```


-------------------------------------------------------------------------------

## Uninstall

If you want to stop Mary Poppins, you'll also need to remove the corresponding Github Webhook.

You can uninstall the web hook by running the following:

```shell
mary-poppins remove config.js
```

To verify that the hook isn't there anymore, you can run:

```shell
mary-poppins hooks config.js
```

Which will log something like this:

```
#12345678
  active: true
  url:    http://example.com:3000/
```

Alternatively, you can remove the hook by visiting "https://github.com/**you**/**your-repo**/settings/hooks" and clicking "remove."

![bad photoshop](https://raw.github.com/btford/mary-poppins/master/img/github-hooks.png)

-------------------------------------------------------------------------------

## Cache

Mary Poppins caches Github repo data to reduce the number of Github calls she needs to make.
This cache is stored in `.cache` by default.
`mary-poppins` is pretty good at knowing when she has a dirty cache, but you can remove this directory if you'd like to.


-------------------------------------------------------------------------------

## Programatic API

The programmatic API is useful for authoring plugins.
If you don't need to interact with Mary Poppins's plugins, you might be better off using [`metahub`](https://github.com/btford/metahub).


### Constructor

Useful for extending Poppins.
Note that Poppins extends [metahub](https://github.com/btford/metahub) and is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter).

```javascript
var util = require('util');
var Poppins = require('poppins').Poppins;

var MrsFeatherbottom = function () {};
util.inherits(MrsFeatherbottom, Poppins);

var nanny = new MrsFeatherbottom({});
```

### factory

```javascript
var config = { /* ... */ };
var poppins = require('poppins')(config);
```

### `poppins.server`

An [express](http://expressjs.com/) instance that listens for updates from Github's web hook.

### `poppins.config`

Core config options:

```javascript
config = {
  target: {
    user: 'myname',
    repo: 'myrepo'
  },
  login: {
    username: 'myrobotname',
    password: 'supersecretpassword'
  },
  hook: {
    url: 'http://example.com:1234',
    port: 1234
  }
};
```

See [`example-config.js`](https://github.com/btford/mary-poppins/blob/master/example-config.js).

## Events

`Poppins` is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter).

### `pullRequestOpened`

```javascript
poppins.on('pullRequestOpened', function (data) { /*...*/ }
```

-------------------------------------------------------------------------------

## Authoring Plugins

Plugins are simply functions that add properties or listeners to a `Poppins` object.

Take a look at [poppins-pr-checklist](https://github.com/btford/poppins-pr-checklist) for an example.

-------------------------------------------------------------------------------

## Developing Mary Poppins

Resources:

* https://help.github.com/articles/post-receive-hooks
* http://requestb.in/

## License
MIT
