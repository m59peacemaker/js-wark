import { map as Emitter_map } from '../Emitter/index.js'
import { derive } from './derive.js'

export const switchMap = f => e => derive (Emitter_map (v => [ f(v) ]) (e)) ((occur, o) => occur((o)[0]))
