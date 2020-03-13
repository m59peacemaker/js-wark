import * as Emitter from '../Emitter'
import { add, identity, noop } from '../util'

/*
	This is shared, but always unique due to Symbol. It would not cause any difference in behavior if two instances of the library came into contact.
	The number inside the symbol arbitrary and just for debugging and testing. The library never examines it and no application should ever examine it.
	The symbol acts as a unique identifier to the propagation from a source event and is used to interact with the cache in behaviors so that the behavior can be sampled multiple times within a propagation and return the same value each time.
*/
const nextTime = (n => () => Symbol(n++))(0)

function Event () {
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

	return Object.assign(event, {
		t: () => t,
		occur,
		occurrence_pending,
		subscribe: occurrence.subscribe
	})
}

function NeverEvent () {
	const subscribe = () => noop
	return {
		t: () => null,
		subscribe,
		occurrence_pending: { subscribe },
	}
}

function DerivedEvent (dependencies_source, f) {
	const { emit, subscribe } = Emitter.create()
	let t = null
	let pending_t = null
	const dependencies_pending = new Set()
	const dependency_occurrences_now = new Map()
	const occur = v => {
		t = pending_t
		emit(v)
	}

	const combineDependencies = getEmitterForDependency => {
		const combineArray = dependencies => Emitter.derive(dependencies.map(getEmitterForDependency), (emit, { value, index }) => emit({ value, index, dependency: dependencies[index] }))
		return Array.isArray(dependencies_source)
			? combineArray(dependencies_source)
			: Emitter.switchMap (combineArray) (dependencies_source)
	}

	const dependency_occurrence_pending = combineDependencies(dependency => dependency.occurrence_pending)
	const occurrence_pending = Emitter.derive(
		[ dependency_occurrence_pending ],
		(emit, { value }) => {
			const { value: isPending, index, dependency } = value
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
	)

	const dependency_occurrence = combineDependencies(dependency => dependency)

	dependency_occurrence.subscribe(({ value, index, dependency }) => {
		pending_t = dependency.t()
		dependency_occurrences_now.set(index, value)
	})

	return {
		t: () => t,
		occurrence_pending,
		subscribe
	}
}

//--- Creating

export const create = Event

export const never = NeverEvent

//--- Combining

export const combineAllWith = f => emitters => DerivedEvent(emitters, (emit, o) => emit(f(o)))

export const combineKeyedWith = f => emitters => {
	const keys = Object.keys(emitters)
	return combineAllWith (o => f(Object.entries(o).reduce((acc, [ k, v ]) => Object.assign(acc, { [keys[k]]: v }), {}))) (Object.values(emitters))
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

//--- Forward References

export const proxy = () => {
	const dependency = create()
	const proxy = switchLatest (dependency)
	const mirror = event => {
		dependency.occur(event)
		return event
	}
	return Object.assign(proxy, { mirror })
}

//--- Transforming

export const map = f => e => DerivedEvent([ e ], (emit, o) => emit(f(o[0])))

export const constant = v => map (() => v)

export const filter = f => e => DerivedEvent([ e ], (emit, o) => f(o[0]) && emit(o[0]))

//--- Flattening

export const switchMap = f => e => DerivedEvent(Emitter.map (v => [ f(v) ]) (e), (emit, o) => emit((o)[0]))

export const switchLatest = switchMap (identity)

//--- Composing with Behaviors

export const snapshot = fn => behavior => event => map (value => fn (behavior.sample(event.t())) (value)) (event)

export const tag = snapshot (b => a => b)

export const attach = snapshot (b => a => [ a, b ])
