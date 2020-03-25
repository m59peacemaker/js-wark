import { transformBehavior } from './transformBehavior.js'
import { lift as Behavior_lift } from '../Behavior/lift.js'

export const lift = f => transformBehavior (Behavior_lift (f))
