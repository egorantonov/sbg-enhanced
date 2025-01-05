import { RunWithOnlineUpdate } from './init'
import { Debug } from './private'

Debug && (Debug())

if (['interactive', 'complete'].includes(document.readyState)) {
  RunWithOnlineUpdate()
}
else {
  window.addEventListener('DOMContentLoaded', _ => RunWithOnlineUpdate())
}