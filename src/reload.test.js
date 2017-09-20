import test from 'ava'
import promise from 'empty-promise'
import makeReload from './reload'

/**
 *
 */

test.beforeEach(t => {
  // A skeleton of chrome mock, so every test
  // doesn't need to implement it from scratch.
  //
  t.context.chrome = {
    runtime: {
      id: 20,
      sendMessage: ()=>{},
    },
    management: {
      extensions: [
        {
          id: 1,
          installType: 'development',
          type: 'extension',
          enabled: true,
        },
      ],
      // testing this one
      setEnabled: (id, boolean, cb) => { cb() },
      getAll(fn) {
        fn(this.extensions)
      },
    },
  }
  return
})

/**
 *
 */

test('disables, and then enables a dev extension', async t => {
  setTimeout(()=>t.fail('Test took too long.'), 0)
  const enabled = promise()
  const disabled = promise()

  const promises = [disabled, enabled]

  const chrome = t.context.chrome
  chrome.management.setEnabled = (id, boolean, cb) => {
    promises.shift().resolve(boolean)
    cb()
  }

  const msg = {command: 'reload'}
  makeReload({chrome})(msg)

  // If this happens in the wrong order, these results
  // will be switched and both should fail.
  const wasDisabled = await disabled
  const wasEnabled = await enabled

  t.is(wasDisabled, false),
  t.is(wasEnabled, true)

  return
})

/**
 *
 */

test('does not attempt to reload self', async t=> {
  const disabled = promise()

  const chrome = t.context.chrome
  chrome.runtime.id = 20
  chrome.setEnabled = (id, boolean, cb) => {
    disabled.resolve(boolean)
    cb()
  }

  const msg = {command: 'reload'}
  await makeReload({chrome})(msg)
    .then(()=> {
      // If we get to here with disabled not already
      // resolved, then setEnabled was not called
      t.pass('setEnabled not called')
      disabled.resolve()
    })
  return
})

/**
 *
 */

test('does not reload disabled extensions', async t => {
  const disabled = promise()

  const chrome = t.context.chrome
  chrome.management.extensions[0].enabled = false
  chrome.management.setEnabled = (id, boolean, cb) => {
    disabled.resolve(boolean)
    cb()
  }

  const msg = {command: 'reload'}
  await makeReload({chrome})(msg)
    .then(()=> {
      // If we get to here with disabled not already
      // resolved, then setEnabled was not called
      t.pass('setEnabled not called')
      disabled.resolve()
    })
  return
})

/**
 *
 */

test('only reloads developer extensions', async t => {
  const disabled = promise()
  const chrome = t.context.chrome

  const installTypes = [ 'admin','normal','sideload','other' ]

  const extensions = [10,11,12,13].map((id, i)=>
    Object.assign({},
      chrome.management.extensions[0],
      { id, installType: installTypes[i]  }
    )
  )

  chrome.management.extensions = extensions
  chrome.management.setEnabled = (id, boolean, cb) => {
    disabled.resolve(boolean)
    cb()
  }

  const msg = {command: 'reload'}
  await makeReload({chrome})(msg)
    .then(()=> {
      // If we get to here with disabled not already
      // resolved, then setEnabled was not called
      t.pass('setEnabled not called')
      disabled.resolve()
    })
  return
})

/**
 *
 */

test('returns array of reloaded extensions', async t => {
  const chrome = t.context.chrome

  const devIds = [14,15,16,17]

  const devExtensions = devIds.map((id, i)=>
    Object.assign({},
      chrome.management.extensions[0],
      {id}
    )
  )
  const normExtensions = [18,19,20,21].map((id, i)=>
    Object.assign({},
      chrome.management.extensions[0],
      { id, installType: 'normal' }
    )
  )

  chrome.management.extensions = devExtensions.concat(normExtensions)

  const msg = {command: 'reload'}
  const reloadedExts = await makeReload({chrome})(msg)

  t.is(Array.isArray(reloadedExts), true)
  t.is(reloadedExts.length, 4)

  const reloadedIds = reloadedExts.map(e=> e.id)
  devIds.forEach(id=>
    t.is(reloadedIds.includes(id), true))

  return
})

/**
 *
 */


test('returns empty array if no dev extensions', async t => {
  const chrome = t.context.chrome

  chrome.management.extensions[0].installType = 'normal'

  const msg = {command: 'reload'}
  const reloadedExts = await makeReload({chrome})(msg)

  t.is(Array.isArray(reloadedExts), true)
  t.is(reloadedExts.length, 0)
  return
})


/**
 *
 */
