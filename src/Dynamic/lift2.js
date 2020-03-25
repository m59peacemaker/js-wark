import { transformBehavior } from './transformBehavior.js'
import { lift2 as Behavior_lift2 } from '../Behavior/lift2.js'

export const lift2 = f => d => transformBehavior (Behavior_lift2 (f) (d))
