import promise from 'empty-promise'

export default makeReload

function makeReload ({chrome}){
  /**
   * Reloads active developer mode extensions and apps
   * @async
   * @param  {Object}  msg            A reload message from
   *                                  livereload
   * @return {Array.<ExtensionInfo>}  Chrome ExtensionInfo
   *                                  objects for extensions
   *                                  & apps that reloaded
   */
  return async msg=> {
    const ChrMgt = chrome.management

    async function reload (ext) {
      const reloaded = promise()

      // enabled -> disabled -> enabled == reload
      ChrMgt.setEnabled(ext.id, false, ()=>
        ChrMgt.setEnabled(ext.id, true, reloaded.resolve))
      await reloaded

      // Forward msg in case extension wants to know
      const forwardMsg = ()=>
        chrome.runtime.sendMessage(ext.id, msg)

      // apps still need to launch to finish reload
      if (ext.type.match(/app/))
        ChrMgt.launchApp(ext.id, forwardMsg)

      // extensions should be up already
      else forwardMsg()

      return ext
    }

    const extensions = promise()
    ChrMgt.getAll(extensions.resolve)

    const reloaded = (await extensions)
      .filter(extension=>
        // installed as unpacked folder
        extension.installType === 'development'
        // if app not specified, only reload enabled
        && extension.enabled === true
        // Clerc shouldn't reload itself
        && extension.id !== chrome.runtime.id
      )
      // and... Go!! :)
      .map(reload)
    return Promise.all(reloaded)
  }
}
