import { Sleep } from './constants'
import { RunWithOnlineUpdate, IsFatalError } from './init'
import { Debug } from './private'
import { Progress } from './progress'

Debug && (Debug())

if (['interactive', 'complete'].includes(document.readyState)) {
  RunWithOnlineUpdate()
}
else {
  window.addEventListener('DOMContentLoaded', _ => RunWithOnlineUpdate())
}