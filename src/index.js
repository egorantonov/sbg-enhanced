import { Events } from './constants'
import { RunWithOnlineUpdate } from './selfUpdate'

window.addEventListener(Events.onLoad, function () {console.log('window loaded')})
window.addEventListener(Events.onLoad, RunWithOnlineUpdate())