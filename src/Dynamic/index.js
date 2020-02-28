import * as Event from '../Event'
import * as Behavior from '../Behavior'
//import { noop, identity, pipe, add, isPromise } from '../utils'

const Dynamic = (event, behavior) => ({ ...event, ...behavior })

const create = Dynamic

const of = (...values) => {
	const event = Event.of(...values)
	return Dynamic(event, Behavior.hold (values[0]) (event))
}

const hold = value => event => Dynamic(
	event,
	Behavior.hold (value) (event)
)

const map = f => dynamic => {
	const behavior = Behavior.map (f) (dynamic)
	return Dynamic(Event.tag (behavior) (dynamic), behavior)
}

const filter = f => dynamic => {
	const event = Event.filter (f) (dynamic)
	return Dynamic(event, Behavior.hold(dynamic.sample()) (event))
}

export {
	create,
	Dynamic,
	filter,
	hold,
	map,
	of
}

// const fromDynamic = initialValue => source => create(initialValue).dependOn([ source ])
// const fromPromise = initialValue => promise => fromEmitter (initialValue) (Emitter.fromPromise(promise))
// const from = initialValue => source =>
// 	(Emitter.isEmitter(source)
// 		? fromEmitter
// 		: isPromise(source)
// 			? fromPromise
// 			: fromDynamic
// 	)
// 	(initialValue)
// 	(source)

// const of = create

// const filter = predicate => source => {
// 	const filtered = fromDynamic (source.get()) (source)
// 	filtered.emitters.changeOpportunity.subscribe(change => {
// 		if (predicate(source.get())) {
// 			change(source.get())
// 		}
// 	})
// 	return filtered
// }

// const lift = fn => dynamics => {
// 	const getValue = () => fn(...dynamics.map(o => o.get()))
// 	const dynamic = create(getValue()).dependOn(dynamics)
// 	dynamic.emitters.changeOpportunity.subscribe(change => change(getValue()))
// 	return dynamic
// }

// const lift2 = fn => a => b => lift (fn) ([ a, b ])

// const lift3 = fn => a => b => c => lift (fn) ([ a, b, c ])

// const map = fn => dynamic => lift (fn) ([ dynamic ])

// const ap = dynamicOfFn => dynamic => lift (identity) ([ dynamicOfFn, dynamic ])

// const get = dynamic => dynamic.get()

// const flatten = source => {
// 	const getValue = source.get().get()
// 	const dynamic = of(getValue())
// 	const dependencyEmitter = Emitter.scan (v => acc => acc.concat(v)) ([ source ]) (source)
// 	map (dynamic.dependOn) (dependencyEmitter)
// 	dynamic.emitters.changeOpportunity.subscribe(change => change(getValue()))
// 	return dynamic
// }

// const switchTo = source => {
// 	const getValue = source.get().get()
// 	const dynamic = of(getValue())
// 	const dependencyEmitter = Emitter.scan (v => acc => [ source, v ]) ([ source ]) (source)
// 	map (dynamic.dependOn) (dependencyEmitter)
// 	dynamic.emitters.changeOpportunity.subscribe(change => change(getValue()))
// 	return dynamic
// }

// const flatMap = source => flatten(map(source))

// const chain = flatMap

// const switchMap = source => switchTo(map(source))
