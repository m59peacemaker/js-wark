import * as Emitter from '../Emitter'
import { add, identity, noop } from '../util'

/*
	This is shared, but always unique due to Symbol. It would not cause any difference in behavior if two instances of the library came into contact.
	The number inside the symbol arbitrary and just for debugging and testing. The library never examines it and no application could should ever examine it.
	The symbol acts as a unique identifier to the propagation from a source event and is used to interact with the cache in behaviors so that the behavior can be sampled multiple times within a propagation and return the same value each time.
*/
const nextTime = (n => () => Symbol(n++))(0)

function Event () {
	const occurrence = Emitter.create()
	const occurrence_pending = Emitter.create()
	const occurrence_settled = Emitter.create()
	let t = null

	const occur = value => {
		t = nextTime()
		occurrence_pending.emit()
		occurrence.emit(value)
		occurrence_settled.emit()
	}

	function event (v) { return occur(v) }

	return Object.assign(event, {
		t: () => t,
		occur,
		occurrence_pending,
		occurrence_settled,
		subscribe: occurrence.subscribe
	})
}

function NeverEvent () {
	const subscribe = () => noop
	return {
		t: () => null,
		subscribe,
		occurrence_pending: { subscribe },
		occurrence_settled: { subscribe }
	}
}

function DerivedEvent (dependencies_source, fn) {
	const { emit, subscribe } = Emitter.create()
	let t = null

	const combine_dependency_emitters = getEmitterForDependency => {
		const concat_dependencies = dependencies => Emitter.concatAll(dependencies.map(getEmitterForDependency))
		return Array.isArray(dependencies_source) ? concat_dependencies(dependencies_source) : Emitter.switchMap (concat_dependencies) (dependencies_source)
	}

	const dependency_occurrence_settled = combine_dependency_emitters(dependency => dependency.occurrence_settled)
	const dependency_occurrence = combine_dependency_emitters((dependency, index) => Emitter.map (value => ({ [index]: value, moment_t: dependency.t() })) (dependency))
	const dependency_occurrence_pending = combine_dependency_emitters(dependency => dependency.occurrence_pending)

	const count_of_dependencies_pending_occurrence = Emitter.fold
		(add)
		(0)
		(Emitter.concatAll([
			Emitter.constant (1) (dependency_occurrence_pending),
			Emitter.constant (-1) (dependency_occurrence_settled)
		]))

	const all_dependencies_settled = Emitter.filter
		(count_pending => count_pending === 0)
		(count_of_dependencies_pending_occurrence)

	const dependency_occurrences_now = Emitter.bufferTo (all_dependencies_settled) (dependency_occurrence)
	const occurrence_opportunity_event = Emitter.filter
		(dependency_occurrences => dependency_occurrences.length > 0)
		(dependency_occurrences_now)
	const occurrence_opportunity = Emitter.map
		(dependency_occurrences => {
			const { moment_t, ...o } = Object.assign(...dependency_occurrences)
			const occur = v => {
				t = moment_t
				return emit(v)
			}
			fn(occur, o, moment_t)
		})
		(occurrence_opportunity_event)

	return {
		t: () => t,
		occurrence_pending: dependency_occurrence_pending,
		occurrence_settled: all_dependencies_settled,
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

export const combineByLeftmost = combineAllWith (o => Object.values(o)[0])

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
