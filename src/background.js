/* global chrome */
import liveReloadSocket from './livereload.js'

var badge = {
  badge: 'hide',
  badges: {
    hide: [''],
    ok: [' OK ', '#44992c'],
    no: [' NO ', '#f33'],
    connected: ['-(c-', [42,181,130,200]],
    // not using disconnect badge b/c visually dominating
    disconnected: ['-(  c-', [179,179,29,200]],
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
  },
}
// we'll start with disconnected badge
// badge.set('hide')

/////////////////////////////////////////////////////

function reloadExtensions(msg) {
  var app = msg.path

  // disable then enable 1 extension or app
  function reload (ext) {
    // false for disable, true for enable
    chrome.management.setEnabled(ext.id, false, function() {
      chrome.management.setEnabled(ext.id, true, function() {
        // func to tell extension it was auto-reloaded
        function forwardMsg(){
          chrome.runtime.sendMessage(ext.id, msg)
        }
        // apps still need launch
        if (ext.type.match(/app/))
          chrome.management.launchApp(ext.id, forwardMsg)
        else forwardMsg()
        console.log(ext.name + ' reloaded')
        // show an 'OK' badge
        badge.tempSet('ok')
      })
    })
  }

  chrome.management.getAll(function(extensions) {
    extensions = extensions.filter(function (ext){
      return (
        // installed as unpacked folder
        (ext.installType==='development')
        // if app not specified, only reload enabled
        && (app || ext.enabled===true)
        // restrict to app name or id if given
        // && ( (!app) || app===ext.name
        //   || app===ext.id)
        // Clerc shouldn't reload itself
        && (ext.id !==chrome.runtime.id)
      )
    })
    extensions.forEach(reload)
  })
}

//////////////////////////////////////////////

const messenger = {
  message (msg){
    console.log('messenger', msg)
    if (msg && msg.error)
      return onError(msg.error)
    reloadExtensions(msg)
  },
}

const onOpen = ()=> {
  console.log('connected to livereload')
  badge.set('ok')
  badge.delay('connected', 1200)
  chrome.browserAction.onClicked.removeListener(connect)
  chrome.browserAction.onClicked.addListener(disconnect)
}

const onClosed = ()=> {
  console.log('disconnected from livereload')
  badge.set('hide')
  chrome.browserAction.onClicked.removeListener(disconnect)
  chrome.browserAction.onClicked.addListener(connect)
}

const onError = err=> {
  badge.set('no')
  badge.delay('hide', 1200)
  console.error(err)
}

const lrSocket = liveReloadSocket({
  onOpen,
  onClosed,
  WebSocket,
  messenger,
  onError,
})

const connect = ()=> lrSocket.connect()
const disconnect = ()=> lrSocket.disconnect()
chrome.browserAction.onClicked.addListener(()=> lrSocket.connect())





////
