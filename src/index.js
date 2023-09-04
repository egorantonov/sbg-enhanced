import { Events, Sleep } from './constants'
import { RunWithOnlineUpdate } from './selfUpdate'

window.addEventListener(Events.onLoad, function () {console.log('window loaded')})
await Sleep(1000).then(_ => RunWithOnlineUpdate())