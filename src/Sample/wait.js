import { wait as Event_wait } from '../Event/wait.js'
import { memoize } from '../util/memoize.js'
import { construct } from './construct.js'
import { map } from './map.js'

/*
	TODO: Maybe this can be better by somehow being more generic, like capturing the generic essence of memoization itself?
	and then this would be derived from a higher level composition rather than `construct`.
*/
const waiting = construct(() => memoize (ms => Event_wait ({ ms })))

export const wait = ({ ms }) => map (f => f(ms)) (waiting)
