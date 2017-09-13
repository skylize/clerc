const handshake = JSON.stringify({
  command: 'hello',
  protocols: [
    'http://livereload.com/protocols/official-7',
    'http://livereload.com/protocols/official-8',
    'http://livereload.com/protocols/2.x-origin-version-negotiation',
    'https://livereload.com/protocols/official-7',
    'https://livereload.com/protocols/official-8',
    'https://livereload.com/protocols/2.x-origin-version-negotiation',
  ],
})

// Let's give consumer some nice feedback if she forgets a dependency.
const unimplemented = {
  onOpen: ()=> console.log('no onOpen listener'),

  onClose: ()=> console.log('no onClose listener'),

  onError: e=>
    console.error('error thrown, but no callback'
      + ' to pass it to.', e),

  // This dependency is special. Throw instead of warn.
  WebSocket: function (){
    throw 'missing WebSocket Constructor'
  },

  messenger: {
    message: msg=> console.log(
      'No messenger to hear this message: ',
      msg),
  },
}

/**
 *
 */

const makeLivereloadSocket =  ({
  // Seems reasonable to use LiveReload's default
  // port on localhost if none provided.
  port = 35729,
  host = 'localhost',
  onOpen = unimplemented.onOpen,
  onClose = unimplemented.onClose,
  onError = unimplemented.onError,
  WebSocket = unimplemented.WebSocket,
  messenger = unimplemented.messenger,
})=> {

  let socket // active socket goes here

  function parseMsg(evt) {
    let msg
    try {msg = JSON.parse(evt.data) }
    catch (e) {
      socket.close()
      onError(e)
    }
    return msg
  }

  // Must receive hello from server before accepting
  // any other messages.
  function hello(evt) {
    const msg = parseMsg(evt)
    if (msg && msg.command === 'hello')
      listen()
    else {
      socket.close()
      onError(
        new Error('Invalid "hello" from server'))
    }
  }

  function onSocketOpen() {
    socket.send(handshake)
    socket.onmessage = hello
  }

  function onSocketClose() {
    // a little light cleanup
    ['onclose', 'onopen', 'onerror', 'onmessage']
      .forEach(listener=>
        delete socket[listener])

    onClose()
  }

  function listen() {
    socket.onmessage = evt=> {
      const msg = parseMsg(evt)
      if (msg.command === 'reload')
        messenger.message(msg)
    }
    onOpen()
  }

  function connect() {
    // nothing to do if already connected
    if ( socket && socket.readyState === 1) return

    try{
      socket = new WebSocket(
        `ws://${host}:${port}/livereload`)
    }
    catch(e) { return void onError(e) }

    socket.onopen = onSocketOpen
    socket.onerror = onError
    socket.onclose = onSocketClose

    return socket
  }

  function disconnect() {
    if (socket && socket.close)
      socket.close()
    return socket
  }

  return { connect, disconnect }
}

export default makeLivereloadSocket
