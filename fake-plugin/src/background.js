/* global chrome */

console.log('Fake plugin started')

// listen for message from external extensions
chrome.runtime.onMessageExternal.addListener(
  (msg, sender, resp) => {

    console.log({msg, sender, resp})
    // reload if you get a reload command
    if (msg.command && msg.command === 'reload')
    {
      console.log('received reload command')
    }
    
  }
)
