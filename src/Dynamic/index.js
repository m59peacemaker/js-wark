import * as Event from '../Event'
import * as Behavior from '../Behavior'

const Dynamic = (event, behavior) => {
	const subscribe = f => {
		f(behavior.sample(event.t))
		return event.subscribe(f)
	}
	return { update: event, ...behavior, subscribe }
}

const DiscreteBehavior = (value, update) => {
	update.subscribe(v => value = v)
	return {
		sample: () => value
	}
}

// TODO: make this not ducky
export const isDynamic = v => v.update && v.sample

export const create = Dynamic

/*export const of = (...values) => {
	const event = Event.of(...values)
	return Dynamic(event, hold (values[0]) (event))
}*/

export const constant = value => hold (value) (Event.never())

export const update = dynamic => dynamic.update

export const transformEvent = f => dynamic => {
	const event = f(dynamic.update)
	return hold (dynamic.sample(dynamic.update.t())) (event)
}

export const transformBehavior = f => dynamic => {
	const behavior = f(dynamic)
	return Dynamic(Event.tag (behavior) (dynamic.update), behavior)
}

export const hold = value => event => Dynamic(event, DiscreteBehavior(value, event))

export const lift = f => transformBehavior (Behavior.lift (f))

export const lift2 = f => d => transformBehavior (Behavior.lift2 (f) (d))

export const map = f => transformBehavior (Behavior.map (f))

export const filter = f => transformEvent (Event.filter (f))

export const forwardReference = () => {
	const e_ref = Event.forwardReference()
	const b_ref = Behavior.createForwardReference({ pre_assign_sample_error_message: 'Dynamic forwardReference should not be sampled before being assigned!' })

	const assign = dynamic => {
		e_ref.assign(dynamic.update)
		b_ref.assign(dynamic)
		return dynamic
	}

	return Object.assign(Dynamic(e_ref, b_ref), { assign })
}

// TODO: figure out the todos and make stuff better and document it, or ditch these, dunno yet
// TODO: maybe a pattern will emerge for creating functions that do `isDynamic(v) ? [ v ] : []` (in whatever generic/reusable way) Maybe something about monoids and empty, or just a wrapper around fold
// having a recentN transducer and a reduction for Event and a different one for Dynamic  would probably settle everything like this
/*export const recentN = n => v =>
	fold
		(v => acc => [ ...acc.slice(Math.max(0, acc.length - n + 1)), v ])
		(isDynamic(v) ? [ v.sample() ] : [ ])
		(isDynamic(v) ? v.update : v) // TODO: yikes, these checks are annoying

export const bufferN = n => startEvery => v => // again with the awfulness
	filter
		(buffer => buffer.length === n)
		(fold
			(v => buffer => [ ...(buffer.length === Math.max(n, startEvery) ? buffer.slice(startEvery) : buffer), v ])
			(isDynamic(v) ? [ v.sample() ] : [ ])
			(isDynamic(v) ? v.update : v)
		)
export const pairwise = bufferN (2) (1)
*/

export * from './chain'
export * from './fold'
export * from './onOff'
export * from './toggle'
