export function LongTouch(touchStart, timeoutID) {
  if (Date.now() - touchStart < 1000) {
    clearTimeout(timeoutID)
  }
}
