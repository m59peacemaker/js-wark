import * as Event from '../Event'
import * as Behavior from '../Behavior'

const Dynamic = (event, behavior) => {
	const subscribe = f => {
		f(behavior.sample(event.t))
		return event.subscribe(f)
	}
	return { updates: event, ...behavior, subscribe }
}

const DiscreteBehavior = (value, updates) => {
	updates.subscribe(v => value = v)
	return {
		sample: () => value
	}
}

// TODO: maybe make this not ducky?
export const isDynamic = v => v.updates && v.sample

export const create = Dynamic

/*export const of = (...values) => {
	const event = Event.of(...values)
	return Dynamic(event, hold (values[0]) (event))
}*/

// TODO: is this ever useful rather than Behavior.constant? If so, make Event.never() and use it here
//export const constant = value => Dynamic.hold (value) ({ subscribe: () => {} })

export const updates = dynamic => dynamic.updates

export const transformEvent = f => dynamic => {
	const event = f(dynamic.updates)
	return hold (dynamic.sample(dynamic.updates.t)) (event)
}

export const transformBehavior = f => dynamic => {
	const behavior = f(dynamic)
	return Dynamic(Event.tag (behavior) (dynamic.updates), behavior)
}

export const hold = value => event => Dynamic(event, DiscreteBehavior(value, event))

export const lift = f => transformBehavior (Behavior.lift (f))

export const lift2 = f => d => transformBehavior (Behavior.lift2 (f) (d))

export const map = f => transformBehavior (Behavior.map (f))

export const filter = f => transformEvent (Event.filter (f))

export const proxy = () => {
	const e_proxy = Event.proxy()
	const b_proxy = Behavior.createProxy({ pre_mirror_sample_error_message: 'Dynamic proxy should not be sampled before being mirrored!' })

	const mirror = dynamic => {
		e_proxy.mirror(dynamic.updates)
		b_proxy.mirror(dynamic)
		return dynamic
	}

	return Object.assign(Dynamic(e_proxy, b_proxy), { mirror })
}

export const fold = reducer => initialValue => event => {
	const p = proxy()
	return p.mirror(
		hold
			(initialValue)
			(Event.snapshot (b => a => reducer (a) (b)) (p) (event))
	)
}

// TODO: figure out the todos and make stuff better and document it, or ditch these, dunno yet
// TODO: maybe a pattern will emerge for creating functions that do `isDynamic(v) ? [ v ] : []` (in whatever generic/reusable way) Maybe something about monoids and empty, or just a wrapper around fold
// having a recentN transducer and a reduction for Event and a different one for Dynamic  would probably settle everything like this
export const recentN = n => v =>
	fold
		(v => acc => [ ...acc.slice(Math.max(0, acc.length - n + 1)), v ])
		(isDynamic(v) ? [ v.sample() ] : [ ])
		(isDynamic(v) ? v.updates : v) // TODO: yikes, these checks are annoying

export const bufferN = n => startEvery => event =>
	filter // TODO: think through implications of the value without the filter... this is one big expression that seems like it would be composed up from some smaller pieces
		(buffer => buffer.length === n)
		(fold
			(v => buffer => [ ...(buffer.length === Math.max(n, startEvery) ? buffer.slice(startEvery) : buffer), v ])
			([])
			(event)
		)

export const pairwise = bufferN (2) (1)
