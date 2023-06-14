import { Events } from '../constants'

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
