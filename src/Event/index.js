import * as Emitter from '../Emitter'
import { add, identity, noop } from '../utils'

function AtemporalEvent () {
	const emitter = Emitter.create()
	const emit = value => {
		occurrence_pending.emit()
		emitter.emit(value)
		occurrence_settled.emit()
	}
	const occurrence_pending = Emitter.create()
	const occurrence_settled = Emitter.create()

	return {
		emit,
		occurrence_pending,
		occurrence_settled,
		subscribe: emitter.subscribe
	}
}

function Event (time, fn = noop) {
	const e = AtemporalEvent()

	const emit = value => {
		time.forward()
		e.emit(value)
	}

	time.start.subscribe(() => fn(emit))

	return {
		...e,
		emit,
		time
	}
}

function DerivedEvent (time, dependencies_source, fn) {
	const emitter = Emitter.create()

	const combine_dependency_emitters = getEmitterForDependency => {
		const concat_dependencies = dependencies => Emitter.concatAll(dependencies.map(getEmitterForDependency))
		return Array.isArray(dependencies_source) ? concat_dependencies(dependencies_source) : Emitter.switchMap (concat_dependencies) (dependencies_source)
	}

	const dependency_occurrence_settled = combine_dependency_emitters(dependency => dependency.occurrence_settled)
	const dependency_occurrence = combine_dependency_emitters((dependency, index) => Emitter.map (value => ({ [index]: value  })) (dependency))
	const dependency_occurrence_pending = combine_dependency_emitters(dependency => dependency.occurrence_pending)

	const count_of_dependencies_pending_occurrence = Emitter.scan
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
		(dependency_occurrences => fn(emitter.emit, Object.assign(...dependency_occurrences)))
		(occurrence_opportunity_event)

	return {
		time,
		occurrence_pending: dependency_occurrence_pending,
		occurrence_settled: occurrence_opportunity,
		subscribe: emitter.subscribe,
	}
}

const create = Event

const of = time => (...values) => Event(time, emit => values.forEach(value => emit(value)))

const map = f => e => DerivedEvent(e.time, [ e ], (emit, o) => emit(f(o[0])))

const merge = emitters => DerivedEvent(emitters[0].time, emitters, (emit, o) => emit(Object.values(o)))

const switchMap = f => e => DerivedEvent(e.time, Emitter.map (v => [ f(v) ]) (e), (emit, o) => emit((o)[0]))

const filter = f => e => DerivedEvent(e.time, [ e ], (emit, o) => f(o[0]) && emit(o[0]))

// to solve the loop/hold/snapshot issue, this may need to be redone on top of DerivedEvent where if the Behavior has a .event (is an event derived behavior), take it as a dependency or something
// compose with it some kind of way anyway. Maybe map (() => behavior.sample) (switchMap(() => behavior.event))
// what if the snapshot lets the behavior know what time it is asking for a value, and then the behavior can emit 
// snapshot event occurs, subscribes to behavior sample emitter, behavior 
// behavior.sample = fn => update.subscribe
const snapshotDiscreteBehavior = fn => behavior => event => DerivedEvent(event.time, [ event, behavior.update ], (emit, o) => o[0] && emit(o.hasOwnProperty[1] ? o[1] : behavior.sample()))
// the discrete behavior really is a derivedEvent and needs to be depended upon alongside the snapshot event
const snapshotBehavior = fn => behavior => event => map (value => fn(behavior.sample()) (value)) (event)
const snapshot = fn => behavior => (behavior.update ? snapshotDiscreteBehavior : snapshotBehavior)(fn)(behavior)

//const tag = behavior => event => map (v => behavior.sample()) (event)
const tag = snapshot (b => a => b)

//const attach = behavior => event => map (v => [ v, behavior.sample() ]) (event)
const attach = snapshot (b => a => [ a, b ])


export {
	AtemporalEvent,
	attach,
	create,
	DerivedEvent,
	Event,
	filter,
	map,
	merge,
	of,
	snapshot,
	switchMap,
	tag
}

// TODO: solve the issue of whether Event is a list of occurrences across time or a list across time of a list of simultaneous occurrences
// if the latter, then flatMap, etc work naturally in cases where there are simultaneous events... otherwise, you have a list of occurrences where only a single value makes sense here
// const flatMap = f => e => {
// 	const dependencies_emitter = Emitter.scan (v => acc => acc.concat(v)) ([ ]) (e)
// 	const event = DerivedEvent((emit, occurrences) => {
// 		const values = Object.values(occurrences)
// 		emit(f(values.length > 1 ? values : values[0]))
// 		onsole.log({ occurrences: Object.values(dependency_occurrences) })
// 		Object.values(dependency_occurrences).forEach((v, index) => {
// 			console.log({ v })
// 				if (index === 0) event.occurrence_pending.emit()
// 			emit(f(v))
// 		})
// 		values.slice(1).forEach(() => event.occurrence_settled.emit())
// 	}, dependencies_emitter)
// 	return event
// }
