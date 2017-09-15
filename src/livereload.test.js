import test from 'ava'
import sinon from 'sinon'
import EmptyPromise from 'empty-promise'
import makeLrSocket from './livereload.js'

// just for reference when writing tests
const sampleServerHello = { /* eslint-disable quotes */
  "command": "hello",
  "protocols": [
    "http://livereload.com/protocols/official-7",
  ],
  "serverName":"tiny-lr",
} /* eslint-enable quotes */

const ports =  {
  valid: 35729,
  invalid: 55555,
}
const hosts = {
  valid: 'localost',
  invalid: 'wronghost',
}
const helloEvent = JSON.stringify({
  data: {command: 'hello'},
})
const reloadEvent = JSON.stringify({
  data: {command: 'reload'},
})

test('connects to websocket', t=> {
  const spy = sinon.spy()
  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.valid,
    messenger: {message(){}},
    WebSocket: spy,
  })
  lrSocket.connect()
  t.is(spy.called, true)
})

test('sends a hello', t=> {
  const spy = sinon.spy()

  function WebSocket() {
    this.send = spy
  }

  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.valid,
    messenger: {message(){}},
    WebSocket,
  })

  const websocket = lrSocket.connect()
  websocket.onopen()

  t.is(spy.called, true)
  t.is(JSON.parse(spy.args[0][0]).command, 'hello')
})

test('hangs up if no hello', t=> {
  const spy = sinon.spy()

  function WebSocket() {
    this.send = ()=> {},
    this.close = spy
  }

  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.valid,
    messenger: {message(){}},
    WebSocket,
    onError: ()=> {},
  })

  const websocket = lrSocket.connect()
  websocket.onopen()
  websocket.onmessage('bad string')

  t.is(spy.called, true)
})

test('fails to create socket with invalid host', t=> {
  const validUrl =
    `ws://${hosts.valid}:${ports.valid}/livereload`

  function WebSocket(url) {
    if (url !== validUrl) throw 'bad url'
  }

  const spy = sinon.spy()
  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.invalid,
    messenger: {message(){}},
    WebSocket,
    onError: spy,
  })

  const websocket = lrSocket.connect()

  t.is(websocket, void 0)
  t.is(spy.called, true)
})

test('fails to create socket with invalid port', t=> {
  const validUrl =
    `ws://${hosts.valid}:${ports.valid}/livereload`

  function WebSocket(url) {
    if (url !== validUrl) throw 'bad url'
  }

  const spy = sinon.spy()
  const lrSocket = makeLrSocket({
    port: ports.invalid,
    host: hosts.valid,
    messenger: {message(){}},
    WebSocket,
    onError: spy,
  })

  const websocket = lrSocket.connect()

  t.is(websocket, void 0)
  t.is(spy.called, true)
})

test('passes reload message to messenger', async t=> {
  const receivedHello = EmptyPromise()

  function WebSocket() {
    this.send = msg=> {
      receivedHello.resolve()
    }
    this.close = ()=> {}
  }

  const spy = sinon.spy()
  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.valid,
    messenger: {message: spy},
    WebSocket,
    onError: ()=> {},
  })
  const websocket = lrSocket.connect()
  websocket.onopen()
  websocket.onmessage(helloEvent)
  await receivedHello

  websocket.onmessage(reloadEvent)

  t.is(spy.isCalled)
})

test('calls close callback on close', async t=> {
  const receivedHello = EmptyPromise()

  function WebSocket() {}

  const spy = sinon.spy()
  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.valid,
    onClose: spy,
    WebSocket,
  })
  const websocket = lrSocket.connect()
  websocket.onclose()

  t.is(spy.called, true)
})
