import { map as Emitter_map } from '../Emitter'
import { derive } from './derive'

export const switchMap = f => e => derive (Emitter_map (v => [ f(v) ]) (e)) ((occur, o) => occur((o)[0]))
