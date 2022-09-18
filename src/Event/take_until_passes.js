import { filter } from './filter.js'
import { take_until } from './take_until.js'

/*
(X => Boolean) => Event X => Event X
Takes a predicate function, `f`, and an Event, `a`, and returns an Event with the same occurrences as Event `a`, until `f` returns true for the value of `a`, and completes when `f` returns true for the value of `a`.
*/
export const take_until_passes = f => event =>
	take_until
		(filter (f) (event))
		(event)
