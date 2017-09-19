
function makeBadge({chrome}) {
  let state = {
    badge: '',
    pending: undefined,
  }

  const badges = {
    hide: { text: '' },
    ok: {
      text: ' OK ',
      color: '#44992c',
    },
    no: {
      text: ' NO ',
      color: '#f33',
    },
    connected: {
      text: ' -(c- ',
      color: [42,181,130,200],
    },
    disconnected: {
      text: '-(  c-',
      color: [179,179,29,200],
    },
  }

  const browserAction = chrome.browserAction

  function set(badge) {
    if (state.pending) {
      clearTimeout(state.pending)
      state.pending = undefined
    }

    if (!badges[badge]) throw Error(
      `Badge Error: Tried to set non-existant badge ${badge}`)

    const text = badges[badge].text
    browserAction.setBadgeText({ text })

    const color = badges[badge].color
    if (color) browserAction
      .setBadgeBackgroundColor({ color })

    state.badge = badge
  }

  function tempSet(badge, delay) {
    const current = state.badge
    if (current === badge) return

    state.pending = delaySet(current, delay)
    set(badge)
  }

  function delaySet(badge, delay) {
    setTimeout(
      ()=> set(badge),
      delay || 1200,
    )
  }

  function activeBadge() {
    return state.badge
  }

  return { set, tempSet, activeBadge }
}

export default makeBadge
