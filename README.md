# Mary Poppins


![bad photoshop](https://raw.github.com/btford/mary-poppins/master/poppins.jpg)

## What's Poppin'?

Mary Poppins keeps your GitHub PRs and issues tidy.


## Config

The config file is just JavaScript.
See `example-config.js` for an example.

## Install

Install `mary-poppins` via `npm`:

```shell
npm install -g mary-poppins
```

Then you need to add the appropriate [Github repository hook](http://developer.github.com/v3/repos/hooks/).
mary-poppins can do this for you.
Run:

```shell
mary-poppins install config.js
```

If you need to make changes to the config, uninstall then re-install.

## Uninstall

Uninstall disables and removes the Github hook.
You can uninstall by running the following:

```shell
mary-poppins remove
```

To verify that the hook isn't there anymore, you can run:

```shell
mary-poppins hooks
```

Which will log something like this:

```
#12345678
  active: true
  url:    http://example.com:3000/
```

## Running

Once Mary Poppins's GitHub hook is installed, you can have it respond to PRs like this:

```shell
mary-poppins start config.js
```

## Cache

Mary Poppins caches Github repo data to reduce the number of Github calls it needs to make.
This cache is stored in `.cache` by default.
mary-poppins is pretty good at knowing when it has a dirty cache, but you can remove this directory if you'd like to.

## License
MIT
