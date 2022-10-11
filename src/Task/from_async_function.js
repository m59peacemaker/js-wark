import { from_function } from '../Action/from_function.js'
import { map } from '../Action/map.js'
import { from_promise } from '../Event/from_promise.js'

export const from_async_function = f => map (from_promise) (from_function (f))
