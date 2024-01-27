import { Sleep } from './constants'
import { RunWithOnlineUpdate } from './selfUpdate'
import { Debug } from './private'

Debug && (Debug())

await Sleep(1000).then(_ => RunWithOnlineUpdate())