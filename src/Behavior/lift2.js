import { lift } from './lift.js'

export const lift2 = f => a => b => lift (a => b => f (a) (b)) ([ a, b ])
