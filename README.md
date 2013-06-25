# Robo-Friend

Your friendly Github PR and issue helper robot.

## Config

The config file is just JavaScript.
See `example-config.js` for an example.

## Install

Install `robo-friend` via `npm`:

```shell
npm install -g robo-friend
```

Then you need to add the appropriate [Github repository hook](http://developer.github.com/v3/repos/hooks/).
Robo-Friend can do this for you.
Run:

```shell
robo-friend install config.js
```

If you need to make changes to the config, uninstall then re-install.

## Uninstall

Uninstall disables and removes the Github hook.
You can uninstall by running the following:

```shell
robo-friend remove
```

To verify that the hook isn't there anymore, you can run:

```shell
robo-friend hooks
```

Which will log something like this:

```
#12345678
  active: true
  url:    http://example.com:3000/
```

## Running

```shell
robo-friend start config.js
```

## Cache

Robo-friend caches Github repo data to reduce the number of Github calls it needs to make.
This cache is stored in `.cache` by default. Removing this dir...

## License
MIT
