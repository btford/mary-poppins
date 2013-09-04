# Mary Poppins


![bad photoshop](https://raw.github.com/btford/mary-poppins/master/img/poppins.jpg)

## What's Poppin'?

Mary Poppins is an extensible GitHub bot that keeps your PRs and issues tidy.


## Install

Install `mary-poppins` via `npm`:

```shell
npm install -g mary-poppins
```


## Config

The config file is just JavaScript.
See `example-config.js` for an example.

### Plugins

By herself, Mary Poppins don't do anything interesting.


#### Finding Plugins

Search plugins:

```
npm search poppins-
```

Some popular plugins are:

* [poppins-pr-checklist](https://github.com/btford/poppins-pr-checklist) - respond to pull requests with a checklist


#### Installing Plugins

Plugins should be installed locally, in the same directory as the config file.
Plugins are installed with npm:

```
npm install poppins-pr-checklist
```

#### Configuring the Plugin

Plugins are configured by adding properties to `poppins`.
By convention, plugins.


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

![bad photoshop](https://raw.github.com/btford/poppins/master/img/github-hooks.jpg)

-------------------------------------------------------------------------------

## Cache

Mary Poppins caches Github repo data to reduce the number of Github calls she needs to make.
This cache is stored in `.cache` by default.
`mary-poppins` is pretty good at knowing when she has a dirty cache, but you can remove this directory if you'd like to.


-------------------------------------------------------------------------------

## Programatic API

If you don't need to interact with Mary Poppins's plugins, you might be better off using [`metahub`](https://github.com/btford/metahub).


-------------------------------------------------------------------------------

## Authoring Plugins

Plugins are simply functions that add properties or listeners to a `Poppins` object.



Take a look at [poppins-pr-checklist](https://github.com/btford/poppins-pr-checklist) for an example.

-------------------------------------------------------------------------------

## License
MIT
