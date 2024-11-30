import { Sleep } from './constants'
import { RunWithOnlineUpdate } from './init'
import { Debug } from './private'
import { InitProgress } from './progress'

Debug && (Debug())
InitProgress()

await Sleep(1000).then(_ => RunWithOnlineUpdate())