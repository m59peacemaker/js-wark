import * as Emitter from '../Emitter'

import { noop, identity, pipe, add, isPromise } from '../utils'

/* observable contract:
	emits pendingChange (when its change is pending, which is when any of its dependencies emit pendingChange)
	maybe emits changeOpportunity (when all dependencies resolved, if dependencies have changed since pending)
		maybe emits the change (if the change occurred)
	and then emits pendingChangeResolution
*/

const create = initialValue => {
	let value = initialValue

	const observable = Emitter.create()

	const emitters = {
		changeOpportunity: Emitter.create(),
		pendingChange: Emitter.create(),
		pendingChangeResolution: Emitter.create()
	}

	const get = () => value

	const change = newValue => {
		value = newValue
		observable.emit(value)
	}

	const observe = observerFn => {
		observerFn(get())
		return observable.subscribe(observerFn)
	}

	let unsubscribeFromDependencies = noop

	const stopDepending = () => unsubscribeFromDependencies()

	const dependOn = dependencies => {
		stopDepending()

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

		return observable
	}

	Object.assign(
		observable,
		{
			observe,
			get,
			emitters,
			dependOn
		}
	)

	return observable
}

const observablizeEmitter = emitter => {
	const observablized = Emitter.from(emitter)
	return Object.assign(
		observablized,
		{
			get: noop,
			observe: observablized.subscribe,
			emitters: {
				changeOpportunity: observablized,
				pendingChange: observablized,
				pendingChangeResolution: observablized
			}
		}
	)
}

const fromEmitter = initialValue => source => {
	const o = create(initialValue)
	let value
	source.subscribe(newValue => value = newValue)
	o.emitters.changeOpportunity.subscribe(change => change(value))
	// awkwardly, this must be after the above subscriptions because the order of the subscriptions going on is important
	o.dependOn([ observablizeEmitter(source) ])
	return o
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

const lift = fn => observables => {
	const getValue = () => fn(...observables.map(o => o.get()))
	const observable = create(getValue()).dependOn(observables)
	observable.emitters.changeOpportunity.subscribe(change => change(getValue()))
	return observable
}

const lift2 = fn => a => b => lift (fn) ([ a, b ])

const lift3 = fn => a => b => c => lift (fn) ([ a, b, c ])

const map = fn => observable => lift (fn) ([ observable ])

const ap = observableOfFn => observable => lift (identity) ([ observableOfFn, observable ])

const get = observable => observable.get()

const flatten = source => {
	const getValue = source.get().get()
	const observable = of(getValue())
	const dependencyEmitter = Emitter.scan (v => acc => acc.concat(v)) ([ source ]) (source)
	map (observable.dependOn) (dependencyEmitter)
	observable.emitters.changeOpportunity.subscribe(change => change(getValue()))
	return observable
}

const switchTo = source => {
	const getValue = source.get().get()
	const observable = of(getValue())
	const dependencyEmitter = Emitter.scan (v => acc => [ source, v ]) ([ source ]) (source)
	map (observable.dependOn) (dependencyEmitter)
	observable.emitters.changeOpportunity.subscribe(change => change(getValue()))
	return observable
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
