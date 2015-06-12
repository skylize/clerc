# *Clerc*

----
##for Chrome™ Live Extension Reloading Client
Provides a basic client with minimal Live Reload compatibility for Chrome™ App Development.

[Install Clerc from the Chrome™ Webstore](https://chrome.google.com/webstore/detail/clerc/dncedehofgbacgaojmingbdfogecjjbj)

----
##Usage
* Activate your [Live Reload](http://livereload.com) (or compatible) server to watch for file changes. With the server running, click the Clerc icon in Chrome to start listening for reload commands on `localhost:35729`.

* If Clerc receives a message including the attributes ``{command: 'reload', path: ''}``, it will reload all enabled unpacked extensions and apps.

* If Clerc receives a message including the attributes ``{command: 'reload', path: 'app_identifier'}``, with app identifier being the extension name (case sensitive and include spaces) or extension id, it will enable or reload the specified unpacked extension.

* If you want any pages refreshed on reload, then select and reload the relevant tabs from your background script using the Tabs API.

----
## Server example
Example uses a gulp task to start tiny-lr server and watch files. Neither gulp nor tiny-lr is required. 

All that matters is you have **some way to watch for file changes** (here using ``gulp.watch()``) and a **running livereload compliant server** (here using ``tiny-lr``). The server must accept websocket connections on port 35729 and emit properly formatted ``reload`` commands on the same port.

```javascript
// -gulpfile.js

var gulp = require('gulp')
  , tinylr = require('tiny-lr')

function dev (){
  // start livereload server
  var lr = tinylr()
  lr.listen(35729)
  
  // glob describing files to watch
  var watch_glob = 'build/**/*.js'
  
  // monitor files using gulp's built-in watch
  var watcher = gulp.watch(watch_glob)
  
  // Alternative 1: empty string to reload all
  var extension = ''
  // Alternative 2: specify extension to enable or reload
  extension = 'My Awesome Extension'

  watcher.on('change', function (evt){
    // emit "reload" to all livereload clients
    lr.changed({body: {files: [extension]}})
  })
}

gulp.task('dev', dev)
```

----
##Tab Example
Clerc forwards the Reload message to your extension. You can then choose to refresh any relevant tabs as required.

```javascript
// -background.js

// listen for message from external extensions
chrome.runtime.onMessageExternal.addListener(
  function(msg, sender, resp) {

    // reload if you get a reload command
    if (msg.command && msg.command === 'reload')
      autoReload()
  }
);

function autoReload (){

  // look for relevant tabs, here using anything on Amazon
  chrome.tabs.query( { url: 'https://*.amazon.com/*/*' },
    function (tabs) {

      // refresh any tabs found
      tabs.forEach(function (tab){
        chrome.tabs.reload(tab.id)
      })
    }
  )
}
```

----
##Known Issues

#### Won't get fixed
* *Changes to manifest.json are not reflected after reload.*

    You will need to reload manually in that case. Reloading manifest.json requires an uninstall/install action that occurs when you reload from the chrome://extensions window. Clerc can uninstall, but cannot install your extension. The next best option disable/enable, works fine for all files except manifest.json.

    As a side note: calling ``chrome.runtime.reload()`` from inside your extension will reload the manifest. However, if your manifest is invalid, the app will remain partially active, partially broken, and unable to call ``reload()`` again.

* *Tabs aren't refreshed.*
    
    In most cases you wouldn't want every single tab refreshed; it should be limited to the tabs your extension will actually act on. As such, it is your responsibility to reload the tabs you need in your background script. (simple example above)

#### Might get fixed
* *Page Action popups and Browser Action popups still require a click.*
    
    Clerc was originally intended for a different problem, namely Content Scripts which won't refresh at all without disabling or uninstalling.
 
    These popups will naturally refresh without reloading the whole extension. If you *only* need reloading for your Action popups, I suspect the official [LiveReload](http://livereload.com) extension might be up to the job.

* *Ignores any optional parameters passed with the Reload command.*
 
    I don't really know what meaning the other parameters might have to Clerc (except maybe after I address Action popup issue above). I'm happy to consider use cases. I've implemented passing the entire reload message forward to the reloaded extension, so you can do whatever you want with that data in your background script.

* *Only usable on localhost.*
 
    This is unlikely to get fixed by me, but open to pull requests if someone else cares enough to deal with it.

* *Background script Dev Tools closes on reload.*

    I don't really know how to fix this, but plan to research it. If anyone knows what to do, please offer tips or pull request.

----
##Contribute

* *Images*
  
    It would be nice to have the icon.svg simplified to only its visible parts, instead of the gross way I built it. An additional simpler version with 2 rings per circle instead of 4 each would be more attractive for small icon sizes. The 3 sizes of promotional images (used by Chrome Webstore to expose Clerc to users) are pretty boring. We could also use some cleverly informative and attractive 1280x800 screenshots. 

* *Build environment*
  I've populated the repo with a node.js build environment. After pulling, run `npm install` to get dependencies. If the newest (highest number) `dist` folder is the same as you installed from the webstore, run `npm version patch` then `gulp build` before you start. Install the newest `dist` folder into Chrome and disable the webstore copy. If you change the manifest, run `gulp manifest`. Autobuild the js files while you work by typing `gulp watch`. For now you will have to manually reload Clerc after changes, but I'm thinking about making it reload itself also.

* *Tests*
    
    A good test suite would be very helpful moving forward

* *Known Issues*

    Please consider handling one of the issues listed above before implementing your own ideas.

* *Your own ideas*

    Try anything you want and send a pull request for consideration. 

* *Options page*
    
    If you want to add a feature that needs to be optional, please make a basic options page first.