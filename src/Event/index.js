import * as Emitter from '../Emitter'
import { add, identity, noop } from '../utils'

function Event (fn = noop) {
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
		subscribe: emitter.subscribe,
		actualize: () => fn(emit)
	}
}

// TODO: take static array of dependencies or emitter and create the dependency_occurrence* emitters accordingly. No need to switchTo(map( for dependencies that won't ever change
function DerivedEvent (fn, dependencies_emitter = Emitter.create()) {
	const combine_dependency_emitters = getEmitterForDependency => Emitter.switchTo(
		Emitter.map
			(dependencies => Emitter.combine(dependencies.map(getEmitterForDependency)))
			(dependencies_emitter)
	)

	const dependency_occurrence_settled = combine_dependency_emitters(dependency => dependency.occurrence_settled)
	const dependency_occurrence = combine_dependency_emitters((dependency, index) => Emitter.map (value => ({ [index]: value  })) (dependency))
	const dependency_occurrence_pending = combine_dependency_emitters(dependency => dependency.occurrence_pending)

	const count_of_dependencies_pending_occurrence = Emitter.scan
		(add)
		(0)
		(Emitter.combine([
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
		(dependency_occurrences => fn(event_emitter.emit, Object.assign(...dependency_occurrences)))
		(occurrence_opportunity_event)

	const event_emitter = Event()

	// TODO: remove this mess and just pass either an array or emitter when creating
	const depend_on = dependencies => {
		dependencies_emitter.emit(dependencies)
		return event
	}

	const event = {
		depend_on,
		occurrence_pending: dependency_occurrence_pending,
		occurrence_settled: occurrence_opportunity,
		subscribe: event_emitter.subscribe,
	}

	return event
}

const create = Event

const of = (...values) => Event(emit => values.forEach(value => emit(value)))

const map = f => e => {
	return DerivedEvent((emit, dependency_occurrences) => emit(f(dependency_occurrences[0]))).depend_on([ e ])
}

const merge = emitters => DerivedEvent((emit, dependency_occurrences) => emit(Object.values(dependency_occurrences))).depend_on(emitters)

const switchMap = f => e => DerivedEvent((emit, o) => emit(f(Object.values(o)[0])), Emitter.map (Array.of) (e))

const filter = f => e => DerivedEvent((emit, o) => f(o[0]) && emit(o[0])).dependOn([ e ])

const tag = behavior => event => map (() => behavior.sample()) (event)
const attach = behavior => event => map (v => [ v, behavior.sample() ]) (event)

export {
	attach,
	create,
	DerivedEvent,
	Event,
	filter,
	map,
	merge,
	of,
	switchMap,
	tag
}

// TODO: solve the issue of whether Event is a list of occurrences across time or a list across time of a list of simultaneous occurrences
// if the latter, then flatMap, concat, etc work naturally in cases where there are simultaneous events... otherwise, you have a list of occurrences where only a single value makes sense here
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
