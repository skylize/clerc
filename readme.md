# *Clerc*

## for Chrome™ Live Extension Reloading Client

---
Provides a basic client with minimal LiveReload compatibility for Chrome™ Extension Development.

[Install Clerc from the Chrome™ Webstore](https://chrome.google.com/webstore/detail/clerc/dncedehofgbacgaojmingbdfogecjjbj)

----
## Usage

1. Install [from the Chrome™ Webstore](https://chrome.google.com/webstore/detail/clerc/dncedehofgbacgaojmingbdfogecjjbj)

1. Activate your [LiveReload](http://livereload.com) compatible server to watch for file changes.

1. After the server starts, click the Clerc icon in Chrome™ to connect Clerc to your server.

1. If Clerc receives any `reload` message, it will reload all enabled Developer Mode extensions and apps.

Bonus:

* Clerc will forward the reload message as a [`chrome.runtime`](https://developer.chrome.com/apps/runtime) message to the background script of any reloaded extensions. You can [listen for the message](https://developer.chrome.com/apps/messaging) and respond by doing any additional reloading activity, such as refrehsing certain tabs.

----
## What does this work with?

* Clerc should work with any LiveReload compatible server.

* For `webpack`, my current suggestion is [`webpack-livereload-plugin`](https://www.npmjs.com/package/webpack-livereload-plugin). You cannot use `webpack-dev-server` for Chrome™ Extensions because it stores built files in memory instead of on disk.
----
## Example Listener
In addition to reloading your extension, Clerc forwards the Reload message to your extension through `chrome.runtime`. This example listens for that message and then uses the `tabs` API to refresh all open tabs on amazon.com

_background.js_
```javascript

// listen for message from any external extensions
chrome.runtime.onMessageExternal.addListener(msg =>
  // reload if you get a reload command
  if (msg.command === 'reload')
    reloadAmazon()
)

function reloadAmazon (){
  // look for relevant tabs, here using anything on Amazon
  chrome.tabs.query(
    { url: 'https://*.amazon.com/*' },

    tabs =>
      // refresh any tabs found
      tabs.forEach(tab =>
        chrome.tabs.reload(tab.id)
      )
  )
}
```

---
## Planned Features

* Change host and port

* Blacklist extensions from reloading

* BrowerSync

----
## Known Issues

* _Changes to manifest.json are not reflected after reload._

    The `manifest.json` is a special case that causes strange somewhat behaviors when trying to reload. The short version of this bug is that if you have any mistakes in your manifest, Chrome™ will revert to the old "good" manifest, and will ignore further reload it. When making any changes to `manifest.json` you should disconnect Clerc temporarily and reload by hand.o call ``reload()`` again.

* _Tabs aren't refreshed._

    In most cases you wouldn't want every single tab refreshed; it should be limited to the tabs your extension will actually act on. Currently it is your own responsibility to reload any required tabs after Clerc forwards the reload message to your extensions. I do have plans to add a Browser Action page where you can input url globs to reload.


* _Page Action popups and Browser Action popups still require a click._

    This is a small nuisance that I don't really know how to get around. Clerc is mainly intended to deal with the larger problem that Content Scripts won't refresh at all unless you disable or uninstall the extension, while also making it possible to auto reload the webpages that you are affecting.

    These popups will naturally refresh from your build folder without reloading the whole extension. You only need to click away from them and click on the icon again.

* _Background script Dev Tools closes on reload._

    I have no idea how to fix this. If anyone knows what to do, please offer tips or a pull request.

* _Browserify bundled submodules don't refresh_

  I have experienced some issues with submodules of a `browserify` bundle not getting reloaded. I don't use `browserify` anymore, so it's hard for me to test this. If you can put together a minimum case project to replicate this behavior I'd be happy to take a look at it.
