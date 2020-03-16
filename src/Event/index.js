import * as Emitter from '../Emitter'
import { identity, noop } from '../util'

/*
	This is shared, but always unique due to Symbol. It would not cause any difference in behavior if two instances of the library came into contact.
	The number inside the symbol arbitrary and just for debugging and testing. The library never examines it and no application should ever examine it.
	The symbol acts as a unique identifier to the propagation from a source event and is used to interact with the cache in behaviors so that the behavior can be sampled multiple times within a propagation and return the same value each time.
*/
const nextTime = (n => () => Symbol(n++))(1)

const createEventObject = event => Object.assign(Object.create(null), event, {
	[Symbol.toStringTag]: 'Event'
})

export const create = () => {
	const occurrence = Emitter.create()
	const occurrence_pending = Emitter.create()
	let t = null

	const occur = value => {
		t = nextTime()
		occurrence_pending.emit(true)
		occurrence.emit(value)
		occurrence_pending.emit(false)
	}

	function event (v) { return occur(v) }

	return createEventObject(Object.assign(event, {
		occur,
		occurrence_pending,
		subscribe: occurrence.subscribe,
		t: () => t,
	}))
}

export const derive = dependencies_source => f => {
	const { emit, subscribe } = Emitter.create()
	let t = null
	let pending_t = null
	const dependencies_pending = new Set()
	const dependency_occurrences_now = new Map()
	const occur = v => {
		t = pending_t
		emit(v)
	}

	const dependency_occurrence_f = ({ value, index, dependency }) => {
		pending_t = dependency.t()
		dependency_occurrences_now.set(index, value)
	}

	const occurrence_pending_f = ({ value: isPending, index, dependency }, emit) => {
		dependencies_pending[isPending ? 'add' : 'delete'](index)
		if (dependencies_pending.size === 1) {
			emit(true)
		} else if (dependencies_pending.size === 0) {
			dependency_occurrences_now.size && f(occur, Object.fromEntries(dependency_occurrences_now), pending_t)
			dependency_occurrences_now.clear()
			pending_t = null
			emit(false)
		}
	}

	const combineDependencies = getEmitterForDependency => f => handleSwitch => {
		const combineArray = handle_derive => dependencies => Emitter.derive
			(dependencies.map(getEmitterForDependency))
			((emit, { index, value }) => handle_derive({ index, value, dependency: dependencies[index] }, emit))
		return Array.isArray(dependencies_source)
			? combineArray (f) (dependencies_source)
			: handleSwitch (f) (Emitter.switchMap (combineArray((data, emit) => emit(data))) (dependencies_source))
	}

	const occurrence_pending = combineDependencies
		(dependency => dependency.occurrence_pending)
		(occurrence_pending_f)
		(f => emitter => Emitter.derive ([ emitter ]) ((emit, { value }) => f(value, emit)))

	const dependency_occurrence = combineDependencies
		(dependency => dependency)
		(dependency_occurrence_f)
		(f => emitter => {
			emitter.subscribe(f)
			return emitter
		})

	return createEventObject({
		t: () => t,
		occurrence_pending,
		subscribe
	})
}

export const never = () => {
	const subscribe = () => noop
	return createEventObject({
		t: () => null,
		subscribe,
		occurrence_pending: { emit: noop, subscribe },
	})
}

export const forwardReference = () => {
	const dependency = create()
	const ref = switchLatest (dependency)
	const assign = event => {
		dependency.occur(event)
		return event
	}
	return Object.assign(ref, { assign })
}

//--- Combining

export const combineAllWith = f => events => derive (events) ((occur, o) => occur(f(o)))

export const combineKeyedWith = f => events => {
	const keys = Object.keys(events)
	return combineAllWith (o => f(Object.entries(o).reduce((acc, [ k, v ]) => Object.assign(acc, { [keys[k]]: v }), {}))) (Object.values(events))
}

export const combineKeyed = combineKeyedWith (identity)

export const concatWith = whenA => whenB => whenAB => a => b => combineAllWith (o => o.hasOwnProperty(0) ? (o.hasOwnProperty(1) ? whenAB (o[0]) (o[1]) : whenA(o[0])) : whenB(o[1])) ([ a, b ])

export const concatAll = combineAllWith (o => {
	const values = Object.values(o)
	if (values.length > 1) {
		throw new Error('concat must not be called on events that can occur simultaneously!')
	}
	return values[0]
})

export const concat = a => b => concatAll ([ a, b ])

export const combineAllByLeftmost = combineAllWith (o => Object.values(o)[0])

export const combineByLeftmost = a => b => combineAllByLeftmost([ a, b ])

//--- Transforming

export const map = f => e => derive ([ e ]) ((occur, o) => occur(f(o[0])))

export const constant = v => map (() => v)

export const filter = f => e => derive ([ e ]) ((occur, o) => f(o[0]) && occur(o[0]))

//--- Flattening

export const switchMap = f => e => derive (Emitter.map (v => [ f(v) ]) (e)) ((occur, o) => occur((o)[0]))

export const switchLatest = switchMap (identity)

//--- Composing with Behaviors

export const snapshot = fn => behavior => event => map (value => fn (behavior.sample(event.t())) (value)) (event)

export const tag = snapshot (b => a => b)

export const attach = snapshot (b => a => [ a, b ])
