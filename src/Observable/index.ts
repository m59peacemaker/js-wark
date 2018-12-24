import Emitter from './Emitter'

const noop = () => {}

const identity = v => v

const isPromise = v => typeof v.then === 'function'

/* observable contract:
	emits pendingChange (when its change is pending, which is when any of its dependencies emit pendingChange)
	maybe emits changeOpportunity (when all dependencies resolved, if dependencies have changed since pending)
		maybe emits the change (if the change occurred)
	and then emits pendingChangeResolution
*/

const create = ({ initialValue, dependencies = [] }) => {
	let value = initialValue

	const observable = Emitter()

	const get = () => value

	const change = newValue => {
		value = newValue
		observable.emit(value)
	}

	const observe = observerFn => {
		observerFn(value)
		return observable.subscribe(observerFn)
	}

	const dependencyChange = Emitter.combine(dependencies)
	const dependencyPendingChange = Emitter.combine(dependencies.map(dependency => dependency.emitters.pendingChange))
	const dependencyPendingChangeResolution = Emitter.combine(dependencies.map(dependency => dependency.emitters.pendingChangeResolution))

	const pendingChangeCount = Emitter.scan
		(add)
		(0)
		(Emitter.combine([
			Emitter.constant (1) (dependencyPendingChange),
			Emitter.constant (-1) (dependencyPendingChangeResolution),
		]))

	const allDependenciesResolved = Emitter.filter (value => value === 0) (pendingChangeCount)

	const canChange = Emitter.filter
		(dependencyChanges => dependencyChanges.length > 0)
		(Emitter.bufferTo (allDependenciesResolved) (dependencyChange))

	const changeOpportunity = Emitter.constant (change) (canChange)

	const emitters = {
		changeOpportunity,
		pendingChange: dependencyPendingChange,
		pendingChangeResolution: changeOpportunity
	}

	Object.assign(
		observable,
		{
			observe,
			get,
			emitters,
		}
	)

	return observable
}

const observablizeEmitter = emitter => {
	const observablized = Emitter.from(emitter)
	Object.assign(
		observablized
		{
			get: noop,
			observe: observablized.subscribe,
			emitters: {
				changeOpportunity: observablizedEmitter,
				pendingChange: observablizedEmitter,
				pendingChangeResolution: observablizedEmitter
			}
		}
	)
}

const fromEmitter = initialValue => source => create({ initialValue, dependencies: [ observablizeEmitter(source) ] })
const fromObservable = initialValue => source => create({ initialValue, dependencies: [ source ] })
const fromPromise = initialValue => promise => fromEmitter (initialValue) (Emitter.fromPromise(promise))
const from = initialValue => source =>
	(Emitter.isEmitter(source)
		? fromEmitter
		: isPromise(source)
			? fromPromise
			: fromObservable
	)
	(initialValue)
	(source)

const of = value => create({ initialValue: value })
const constant = of

const filter = predicate => source => {
	const filtered = fromObservable (source.get()) (source)
	filtered.emitters.changeOpportunity.subscribe(change => {
		if (predicate(source.get())) {
			change(source.get())
		}
	})
	return filtered
}

const lift = fn => observables => {
	const getValue = () => fn(...observables.map(o => o.get()))
	const observable = create({ initialValue: getValue(), dependencies: observables })
	observable.emitters.changeOpportunity.subscribe(change => change(getValue()))
	return observable
}

const lift2 = fn => a => b => lift (fn) ([ a, b ])

const lift3 = fn => a => b => c => lift (fn) ([ a, b, c ])

const map = fn => observable => lift (fn) ([ observable ])

const ap => observableOfFn => observable => lift (identity) ([ observableOfFn, observable ])

const get = observable => observable.get()

/* observable contract:
	emits pendingChange (when its change is pending, which is when any of its dependencies emit pendingChange)
	maybe emits changeOpportunity (when all dependencies resolved, if dependencies have changed since pending)
		maybe emits the change (if the change occurred)
	and then emits pendingChangeResolution
*/
/*
  pending when `source` is pending or any value of source is pending
	emits change opportunity 
*/

const flatten = source => {
	map (get) (source)
}

const flatMap = () => {}

const chain = flatMap

const switchTo = () => {}

const switchMap = () => {}

export {
	ap,
	chain,
	create,
	filter,
	flatMap,
	flatten,
	from,
	fromObservable,
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
