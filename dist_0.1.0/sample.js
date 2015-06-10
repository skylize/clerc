/* global require, chrome */
'use strict'

// Example uses a gulp task and tiny-lr server.
//  Neither is important. All that matters here 
//  is we have some way to watch for file changes 
//  and a running server that can emit "reload"
//  commands over 35729.
var gulp = require('gulp')
  , tinylr = require('tiny-lr')

function dev (){
  // start livereload server
  var lr = tinylr()
  lr.listen(35729)
  
  // glob describing files to watch
  var watch_glob = 'build/**/*.js'
  
  // watch using gulp's built-in watch functionality
  var watcher = gulp.watch(watch_glob)
  
  watcher.on('change', function (evt){
    // emit "reload" to all livereload clients
    lr.changed({body: {files: [evt.path]}})
  })
}

gulp.task('dev', dev)


// Add something like this to background.js
//  to reload relevant tabs each time your 
//  extension is enabled.
chrome.tabs.query( 
  { url: '*://*.amazon.com/*' },
  function (tabs) {
    tabs.forEach(function (tab){
      chrome.tabs.reload(tab.id)
    })
  }
)