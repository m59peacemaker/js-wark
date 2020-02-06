import * as Emitter from '../Emitter'

import { noop, identity, pipe, add, isPromise } from '../utils'

/* dynamic contract:
	emits pendingChange (when its change is pending, which is when any of its dependencies emit pendingChange)
	maybe emits changeOpportunity (when all dependencies resolved, if dependencies have changed since pending)
		maybe emits the change (if the change occurred)
	and then emits pendingChangeResolution
*/

const create = initialValue => {
	let value = initialValue

	const emitter = Emitter.create()

	const emitters = {
		changeOpportunity: Emitter.create(),
		pendingChange: Emitter.create(),
		pendingChangeResolution: Emitter.create()
	}

	const dynamic = {
		emitter,
		emitters,
		get: () => value,
		set: newValue => {
			emitters.pendingChange.emit()
			change(newValue)
			emitters.pendingChangeResolution.emit()
		},
		subscribe: subscriberFn => {
			subscriberFn(value)
			return emitter.subscribe(subscriberFn)
		}
	}

	const change = newValue => {
		value = newValue
		emitter.emit(value)
	}

	let unsubscribeFromDependencies = noop

	const dependOn = dependencies => {
		unsubscribeFromDependencies()

		const dependencyChange = Emitter.combine(dependencies)
		const dependencyPendingChange = Emitter.combine(dependencies.map(dependency => dependency.emitters.pendingChange))
		const dependencyPendingChangeResolution = Emitter.combine(dependencies.map(dependency => dependency.emitters.pendingChangeResolution))

		const pendingChangeCount = Emitter.scan
			(add)
			(0)
			(Emitter.combine([
				Emitter.constant (1) (dependencyPendingChange),
				Emitter.constant (-1) (dependencyPendingChangeResolution)
			]))

		const allDependenciesResolved = Emitter.filter (value => value === 0) (pendingChangeCount)

		const canChange = Emitter.filter
			(dependencyChanges => dependencyChanges.length > 0)
			(Emitter.bufferTo (allDependenciesResolved) (dependencyChange))

		unsubscribeFromDependencies = pipe([
			Emitter.map (emitters.pendingChange.emit) (dependencyPendingChange),
			Emitter.map
				(() => {
					emitters.changeOpportunity.emit(change)
					emitters.pendingChangeResolution.emit()
				})
				(canChange)
		])

		return dynamic
	}

	return Object.assign(dynamic, {
		dependOn,
	})
}

const emitterToPseudoDynamic = emitter => {
	const e = Emitter.from(emitter)
	return {
		get: noop,
		subscribe: e.subscribe,
		emitter: e,
		emitters: {
			changeOpportunity: e,
			pendingChange: e,
			pendingChangeResolution: e
		}
	}
}

const fromEmitter = initialValue => source => {
	const d = create(initialValue)
	let value
	source.subscribe(newValue => value = newValue)
	d.emitters.changeOpportunity.subscribe(change => change(value))
	// awkwardly, this must be after the above subscriptions because the order of the subscriptions going on is important
	d.dependOn([ emitterToPseudoDynamic (source) ])
	return d
}
const fromDynamic = initialValue => source => create(initialValue).dependOn([ source ])
const fromPromise = initialValue => promise => fromEmitter (initialValue) (Emitter.fromPromise(promise))
const from = initialValue => source =>
	(Emitter.isEmitter(source)
		? fromEmitter
		: isPromise(source)
			? fromPromise
			: fromDynamic
	)
	(initialValue)
	(source)

const of = create

const filter = predicate => source => {
	const filtered = fromDynamic (source.get()) (source)
	filtered.emitters.changeOpportunity.subscribe(change => {
		if (predicate(source.get())) {
			change(source.get())
		}
	})
	return filtered
}

const lift = fn => dynamics => {
	const getValue = () => fn(...dynamics.map(o => o.get()))
	const dynamic = create(getValue()).dependOn(dynamics)
	dynamic.emitters.changeOpportunity.subscribe(change => change(getValue()))
	return dynamic
}

const lift2 = fn => a => b => lift (fn) ([ a, b ])

const lift3 = fn => a => b => c => lift (fn) ([ a, b, c ])

const map = fn => dynamic => lift (fn) ([ dynamic ])

const ap = dynamicOfFn => dynamic => lift (identity) ([ dynamicOfFn, dynamic ])

const get = dynamic => dynamic.get()

const flatten = source => {
	const getValue = source.get().get()
	const dynamic = of(getValue())
	const dependencyEmitter = Emitter.scan (v => acc => acc.concat(v)) ([ source ]) (source)
	map (dynamic.dependOn) (dependencyEmitter)
	dynamic.emitters.changeOpportunity.subscribe(change => change(getValue()))
	return dynamic
}

const switchTo = source => {
	const getValue = source.get().get()
	const dynamic = of(getValue())
	const dependencyEmitter = Emitter.scan (v => acc => [ source, v ]) ([ source ]) (source)
	map (dynamic.dependOn) (dependencyEmitter)
	dynamic.emitters.changeOpportunity.subscribe(change => change(getValue()))
	return dynamic
}

const flatMap = source => flatten(map(source))

const chain = flatMap

const switchMap = source => switchTo(map(source))

export {
	ap,
	chain,
	create,
	filter,
	flatMap,
	flatten,
	from,
	fromDynamic,
	fromPromise,
	fromEmitter,
	lift,
	lift2,
	lift3,
	map,
	of,
	switchMap,
	switchTo
}
