import { Events, EUI, SBG } from '../constants'

export function LongTouchEventListener(target, callback, delay = 1500) {
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
