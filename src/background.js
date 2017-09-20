/* global chrome */
import liveReloadSocket from './livereload'
import makeBadge from './badge'
import makeReload from './reload'

const badge = makeBadge({chrome})
const reload = makeReload({chrome})

//////////////////////////////////////////////

const reloadExtensions = async msg => {
  console.log('msg',msg)
  const reloaded = await reload(msg)
  if (reloaded.length)
    badge.tempSet('ok')
  reloaded.forEach(async ext=>
    console.log(`reloaded ${ext.name}`))
}

const messenger = {
  message (msg){
    if (msg && msg.error)
      return onError(msg.error)

    if (msg && msg.command === 'reload')
      reloadExtensions(msg)
  },
}

const onOpen = ()=> {
  console.log('connected to livereload')
  badge.set('connected')
  badge.tempSet('ok', 1200)
  chrome.browserAction.onClicked.removeListener(connect)
  chrome.browserAction.onClicked.addListener(disconnect)
}

const onClose = ()=> {
  console.log('disconnected from livereload')
  if (badge.activeBadge() !== 'no') {
    badge.set('hide')
    badge.tempSet('disconnected', 1200)
  }
  chrome.browserAction.onClicked.removeListener(disconnect)
  chrome.browserAction.onClicked.addListener(connect)
}

const onError = err=> {
  badge.set('hide')
  badge.tempSet('no', 1900)
  console.error(err)
}

const lrSocket = liveReloadSocket({
  onOpen,
  onClose,
  WebSocket,
  messenger,
  onError,
})

const connect = ()=> lrSocket.connect()
const disconnect = ()=> lrSocket.disconnect()

chrome.browserAction.onClicked.addListener(()=> {
  badge.set('disconnected')
  lrSocket.connect()
})


//
