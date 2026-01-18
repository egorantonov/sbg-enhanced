import { version } from '../package.json'
import { RunWithOnlineUpdate } from './init'
import ApplyPolyfills from './polyfill'
import { Debug } from './private'

window.EUI = {
	...window.EUI,
  version
}

Debug && (Debug())

ApplyPolyfills()

if (['interactive', 'complete'].includes(document.readyState)) {
  RunWithOnlineUpdate()
}
else {
  window.addEventListener('DOMContentLoaded', _ => RunWithOnlineUpdate())
}