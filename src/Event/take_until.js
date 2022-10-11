import { noop } from '../util.js'
import { nothing } from './internal/nothing.js'
import { _call } from '../Reference/call.js'
import { _use } from '../Reference/use.js'


/*
	Event X => Event Y => Event Y
	Takes an Event, `a`, and an Event, `b`, and returns an Event with the same occurrences as Event `b` until Event `a` occurs, and completes when Event `a` occurs.
*/

/*
	The complete event of the returned event is nearly the same as the input complete_event,
	except it needs its complete event to be itself,
	and it needs to occur only once.
	The input complete event may occur many times,
	but it isn't necessary to derive a new event for this purpose.
	Instead, `performing` observes the complete event of its input event
	and unobserves the input event and its complete event when the complete event occurs.
*/
/*
	From a high level perspective, `take_until` returns an Event with a Dynamic `is_complete` that updates to `true` when `complete_event` occurs.
	`take_until` must therefore observe the complete_event so that it can be known whether it has occurred even though it may not have any other observers.
*/

const registry = new FinalizationRegistry(unobserve => unobserve())

/*
	TODO: perhaps rename this to `complete_when` and make `take_until = x => y => complete_when (alt (x) (complete (y)))`
	Otherwise, there is an inconsistency with `take (n) (x)`, if it completes on the nth occurrence OR when `x` completes
*/
/*
	TODO: maybe use a Proxy to clean this up
*/
/*
	TODO: try to get rid of the `referenced` property
*/
export const _take_until = (complete_event, input_event) => {
	const complete = {
		get computed () { return complete_event.computed },
		get occurred () { return complete_event.occurred },
		get observers () { return complete_event.observers },
		get settled () { return complete_event.settled },
		get value () { return complete_event.value },
		get observe () { return complete_event.observe },
		get referenced () { return complete_event }
	}
	complete.complete = complete
	const unobserve = complete_event.observe({
		pre_compute: noop,
		compute: () => {
			if (complete_event.value !== nothing) {
				// TODO: this breaks garbage collection because it references `self`... so does this need to be done differently or is it unnecessary?
				// registry.unregister(complete)
				unobserve()
			}
		}
	})
	registry.register(complete, unobserve)
	return {
		complete,
		get computed () { return input_event.computed },
		get occurred () { return input_event.occurred },
		get observers () { return input_event.observers },
		get settled () { return input_event.settled },
		get value () { return input_event.value },
		get observe () { return input_event.observe },
		get referenced () { return input_event }
	}
}

export const take_until = complete_event => input_event =>
	_use(complete_event, complete_event =>
		_use(input_event, input_event =>
			_take_until(complete_event, input_event)
		)
	)
