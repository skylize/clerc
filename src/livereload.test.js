import test from 'ava'
import promise from 'empty-promise'
import makeLrSocket from './livereload'


/**
 * Some convenience values
 */

// TODO test can handle other ports
const ports =  {
  // This is the default LiveReload port, so most likely
  // to be used.
  valid: 35729,
  // We need a different port to also try as valid because
  // module uses 35729 as default internally.
  different_valid: 32290,
  // Nothing wrong with 55555,just a number that
  // is different from ones we consider valid in tests.
  invalid: 55555,
}
// TODO test can handle other hosts
const hosts = {
  valid: 'localhost',
  different_valid: '129.0.0.1',
  invalid: 'wronghost',
}

// Events to pass into WebSocket.onmessage()
//
const helloEvent = {
  data: JSON.stringify(
    {command: 'hello'}
  ),
}
const reloadEvent = {
  data: JSON.stringify(
    {command: 'reload'}
  ),
}

/**
 *
*  - Each test implements the minimum required mocking of
*    WebSocket in order to verify behavior.
*
*  - Using empty promises as spies. These are promises with
*    no internal content. Instead they have a small external
*    API, of `resolve(val)`, `reject(val)`, and `done()`.
*    The `done` method returns `true` if unresolved, or
*    `false` if resolved/rejected.
*
*  - Rather than emit events, just call the attached listener
*    by name.
*
*  - Tests should not run forever. To ensure broken tests do
*    not hang async tests must include a timeout to fail() or
*    reject an awaited promise. Timers should start at start
*    of test before any async keywords.
*
*  - Set timeout of 0 for next-tick if awaited promise is
*    a spy that should resolve within the same event loop.
*
*/

test('connects to websocket', t=> {
  const spy = promise()
  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.valid,
    messenger: {message(){}},

    WebSocket: function WebSocket(){
      spy.resolve()
    },
  })

  lrSocket.connect()

  t.is(spy.done(), true)
})

/**
 *
 */

test('sends a hello', async t=> {
  setTimeout(()=> t.fail('Test took too long.'), 0)

  const spy = promise()

  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.valid,
    messenger: {message(){}},

    WebSocket: function WebSocket() {
      this.send = spy.resolve
      this.readyState = 1
    },
  })

  const socket = lrSocket.connect()
  socket.onopen()

  t.is(JSON.parse(await spy).command, 'hello')
})

/**
 *
 */

test('hangs up if hello is not valid', t=> {
  const spy = promise()

  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.valid,
    messenger: {message(){}},
    onError: ()=> {},

    WebSocket: function WebSocket() {
      this.send = ()=> {},
      this.close = spy.resolve
    },
  })

  const socket = lrSocket.connect()
  socket.onopen()
  socket.onmessage('bad string')

  t.is(spy.done(), true)
})

/**
 *
 */

test('fails to create socket with invalid host', t=> {
  const validUrl =
    `ws://${hosts.valid}:${ports.valid}/livereload`

  const spy = promise()
  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.invalid,
    messenger: {message(){}},
    onError: spy.resolve,

    WebSocket: function WebSocket(url) {
      if (url !== validUrl) throw 'bad url'
    },
  })

  const socket = lrSocket.connect()

  t.is(socket, void 0)
  t.is(spy.done(), true)
})

test('fails to create socket with invalid port', t=> {
  const validUrl =
    `ws://${hosts.valid}:${ports.valid}/livereload`

  const spy = promise()
  const lrSocket = makeLrSocket({
    port: ports.invalid,
    host: hosts.valid,
    messenger: {message(){}},
    onError: spy.resolve,

    WebSocket: function WebSocket(url) {
      if (url !== validUrl) throw 'bad url'
    },
  })

  const socket = lrSocket.connect()

  t.is(socket, void 0)
  t.is(spy.done(), true)
})

/**
 *
 */

test('passes reload message to messenger', async t=> {
  setTimeout(()=> t.fail('Test took too long.'), 0)

  const helloSpy = promise()
  const msgSpy = promise()

  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.valid,
    messenger: {message: msgSpy.resolve},
    onError: ()=> {},
    onOpen: ()=> {},

    WebSocket: function WebSocket() {
      this.readyState = 1
      this.send = helloSpy.resolve
      this.close = ()=> {}
    },
  })

  const socket = lrSocket.connect()
  socket.onopen()

  // must send a Hello before a Reload will be accepted
  socket.onmessage(helloEvent)
  await helloSpy

  socket.onmessage(reloadEvent)

  t.is(msgSpy.done(), true)
})

/**
 *
 */

test('calls close callback on close', async t=> {
  setTimeout(()=> t.fail('Test took too long.'), 0)
  const spy = promise()

  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.valid,
    onClose: spy.resolve,

    WebSocket: function WebSocket() {},
  })

  const socket = lrSocket.connect()
  socket.onclose()

  t.is(spy.done(), true)
})

/**
 *
 */

test('Waits for open readyState after open event', async t=> {
  setTimeout(()=> t.fail('Test took too long.'), 2000)

  const spy = promise()

  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.valid,
    messenger: {message(){}},

    WebSocket: function WebSocket() {
      this.send = spy.resolve
      this.readyState = 0
      setTimeout(() => {this.readyState = 1}, 400)
    },
  })

  const socket = lrSocket.connect()
  socket.onopen()

  t.is(
    JSON.parse(await spy).command,
    'hello'
  )
})

/**
 *
 */

test('hangs up if too long to fully connect', async t=> {
  const testsComplete = promise()
  setTimeout(()=>
    testsComplete.reject('Test took too long'),
  12000)

  const sendSpy = promise()
  const closeSpy = promise()
  const errorSpy = promise()

  const lrSocket = makeLrSocket({
    port: ports.valid,
    host: hosts.valid,
    messenger: {message(){}},
    onError: errorSpy.resolve,

    WebSocket: function WebSocket() {
      this.send = sendSpy.resolve
      this.close = closeSpy.resolve
      this.readyState = 0
      setTimeout(() => {this.readyState = 1}, 8500)
    },
  })

  const socket = lrSocket.connect()
  socket.onopen()

  setTimeout(async () => {
    t.is(sendSpy.done(), false)
    sendSpy.resolve()

    t.is(closeSpy.done(), true)
    t.is(
      (await errorSpy).message.indexOf('Timeout') > -1,
      true
    )

    testsComplete.resolve()
  }, 9000)

  await testsComplete
})

/**
*
*/
