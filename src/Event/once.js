import { take_until } from './take_until.js'

export const once = x => take_until (x) (x)
