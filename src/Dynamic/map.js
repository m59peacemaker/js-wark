import { transformBehavior } from './transformBehavior.js'
import { map as Behavior_map } from '../Behavior/map.js'

export const map = f => transformBehavior (Behavior_map (f))
