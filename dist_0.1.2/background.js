/*global chrome, console, WebSocket */
/*global setTimeout, setInterval, clearInterval*/
'use strict';

/////////////////////////////////////////////////////

chrome.runtime.onInstalled.addListener(function(details) {
  chrome.tabs.create({url: 'https://github.com/skylize/clerc'})
})


/////////////////////////////////////////////////////

var badge = {
  badge: 'hide',
  badges: {
    hide: [''],
    ok: [' OK ', '#44992c'],
    no: [' NO ', '#f33'],
    connected: ['--(c--', [42,181,130,200]],
    disconnected: ['-(  c-', [179,179,29,200]]
  },

  set: function (b){
    badge.badge = b
    chrome.browserAction
      .setBadgeText({text: this.badges[b][0]})
    if(this.badges[b][1])
      chrome.browserAction
        .setBadgeBackgroundColor({color:this.badges[b][1]})
  },

  tempSet: function (b, delay){
    var currB = badge.badge
    if (currB !== b){
      badge.set(b)
      badge.delay(currB, delay)
    }
  },

  delay: function (b, delay){
    setTimeout(function (){
      badge.set(b)
    }, delay||1200)
  }

}
// we'll start with disconnected badge
badge.set('disconnected')

/////////////////////////////////////////////////////

function reloadExtensions(app) {
  // disable then enable 1 extension or app
  function reload (ext) {
    // false for disable, true for enable
    chrome.management.setEnabled(ext.id, false, function() {
      chrome.management.setEnabled(ext.id, true, function() {
        // extensions done, apps still need launch
        if (ext.type.match(/app/))
          chrome.management.launchApp(ext.id)

        console.log(ext.name + " reloaded")
        // show an "OK" badge
        badge.tempSet('ok')
      })
    })
  }

  chrome.management.getAll(function(extensions) {
    extensions = extensions.filter(function (ext){   
      return (
        // installed as unpacked folder
        (ext.installType==="development")
        // if app not specified, only reload enabled
        && (app || ext.enabled===true)
        // restrict to app name or id if given
        && ( (!app) || app===ext.name
          || app===ext.id)
        // Clerc shouldn't reload itself
        && (ext.id !==chrome.runtime.id)
      ) 
    })
    extensions.forEach(reload)
  })
}

//////////////////////////////////////////////

var ws

function connectSocket() {
  // don't open a bunch of duplicate sockets
  if (ws && ws.readyState !== 3) 
    return
  
  ws = new WebSocket('ws://localhost:35729/livereload')

  var handshake = {
    command: 'hello',
    protocols: [
        'http://livereload.com/protocols/official-7',
        'http://livereload.com/protocols/official-8',
        'http://livereload.com/protocols/2.x-origin-version-negotiation'],
  }
  handshake = JSON.stringify(handshake)

  ws.onerror = function (){
    badge.set('no')
    badge.delay('disconnected', 1200)
    console.log('failed to connect to livereload')
  }

  ws.onopen = function socketopen(){
    console.log('connected to livereload')
    
    ws.send(handshake)

    badge.set('ok')
    badge.delay('connected', 1200)
    
    chrome.browserAction.onClicked.removeListener(connectSocket)
    chrome.browserAction.onClicked.addListener(disconnectSocket)

    ws.onclose = onClosedSocket
  }

  ws.onmessage = function socketmessage(evt) {
    var msg = JSON.parse(evt.data)
    if (msg.command === 'reload')
      reloadExtensions(msg.path)
  }
}

function onClosedSocket(){
  console.log('disconnected from livereload')
  badge.set('disconnected')
  chrome.browserAction.onClicked.removeListener(disconnectSocket)
  chrome.browserAction.onClicked.addListener(connectSocket)
  ws.onclose = null
}

function disconnectSocket() { ws.close() }

chrome.browserAction.onClicked.addListener(connectSocket)

// might as well try to connect on load
connectSocket()
