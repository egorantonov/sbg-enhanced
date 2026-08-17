import { Events, EUI, SBG, Nodes } from '../constants'

/**
 * Obsolete
 */
export function LongTouchEventListenerOld(target, callback, delay = 1500) {
  if (!target || !callback) {
    console.warn('Can\'t set LongTouch event listener: target or callback is missing!')
    return
  }

  target.addEventListener(Events.onTouchStart, () => {
    const touchStart = Date.now()

    const timeoutID = setTimeout(() => {
      callback()
    }, delay ?? 1500)

    target.addEventListener(Events.onTouchEnd, () => { 
      if (Date.now() - touchStart < 1000) {
        clearTimeout(timeoutID)
      }
    }, { once: true })
  })

}

export function LongTouchEventListener(target, callback, delay = 1500) {
  let timer = null
  let startX = 0
  let startY = 0
  let moved = false

  const MOVE_THRESHOLD = 10 // px

  function start(e) {
    const touch = e.touches?.[0] ?? e
    startX = touch.clientX
    startY = touch.clientY
    moved = false

    timer = setTimeout(() => {
      if (!moved) {
        callback(e)
      }
    }, delay)
  }

  function move(e) {
    if (!timer) return

    const touch = e.touches?.[0] ?? e
    const dx = touch.clientX - startX
    const dy = touch.clientY - startY

    if (Math.hypot(dx, dy) > MOVE_THRESHOLD) {
      moved = true
      clearTimeout(timer)
      timer = null
    }
  }

  function end() {
    clearTimeout(timer)
    timer = null
  }

  target.addEventListener(Events.onTouchStart, start, { passive: true })
  target.addEventListener(Events.onTouchMove, move, { passive: true })
  target.addEventListener(Events.onTouchEnd, end)
  target.addEventListener(Events.onTouchCancel, end)
}

export function flavored_fetch(input, options={}) {
	if (!('headers'in options)) options.headers = {}
	const flavor = `EUI/${EUI.Version}`
	if (!options.headers[SBG.Headers.FLAVOR]) {
		options.headers[SBG.Headers.FLAVOR] = flavor
	}
	else {
		let flavors = options.headers[SBG.Headers.FLAVOR].split(' ').filter(x => !x.includes('Stock'))
		if (!flavors.find(x => x == flavor)) flavors.push(flavor)
		options.headers[SBG.Headers.FLAVOR] = flavors.join(' ')
	}
	return fetch(input,options)
}

/**
 * Returns section by its i18n short name: settings.${name}.header
 * @param {string} name 
 */
export function GetSection(name) {
  return Nodes.GetSelector(`h4[data-i18n^="settings.${name}"]`)?.parentElement
}

export const Sections = {
  Global: 'global',
  Interface: 'interface',
  Automation: 'automation',
  Privacy: 'privacy',
  Account: 'account',
  About: 'about'
}
