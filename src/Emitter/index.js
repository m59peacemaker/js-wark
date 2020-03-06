import { identity, noop, pipe } from '../util'

function Emitter () {
	const subscribers = new Map()
	const nextId = (n => () => ++n)(0)

	const emit = value => Array.from(subscribers.values()).map(subscriber => subscriber(value))

	const subscribe = subscriber => {
		const id = nextId()
		subscribers.set(id, subscriber)
		return () => subscribers.delete(id)
	}

	return Object.assign(
		function emitter (value) { emit(value) },
		{
			emit,
			subscribe,
			constructor: Emitter
		}
	)
}

const forward = (emit, { value }) => emit(value)
const DerivedEmitter = (dependencies_source, fn = forward) => {
	const emitter = Emitter()
	const { emit, subscribe } = emitter

	let unsubscribe_from_dependencies = noop
	const subscribe_to_dependencies = dependencies => {
		unsubscribe_from_dependencies()
		unsubscribe_from_dependencies = pipe(dependencies.map((dependency, index) => dependency.subscribe(value => fn(emit, { index, value }))))
	}

	Array.isArray(dependencies_source) ? subscribe_to_dependencies(dependencies_source) : dependencies_source.subscribe(subscribe_to_dependencies)

	return {
		subscribe
	}
}

const create = Emitter

// TODO:
// turn your push based types into a type implementing Observable, transduce it, convert back to your type. You could use a helper like `Emitter.asObservable(tranduceStuff)` that takes and returns an Emitter, but converts to and from Observable to interop with the given fn
// const asObservable = fnOnObservable =>  emitter => fromObservable(fnOnObservable(toObservable(emitter)))

const concatAll = emitters => DerivedEmitter(emitters)

const concat = a => b => concatAll([ a, b ])

const map = f => emitter => DerivedEmitter([ emitter ], (emit, { value }) => emit(f(value)))

const constant = v => map (() => v)

const fold = reducer => acc => emitter => DerivedEmitter(
	[ emitter ],
	(emit, { value }) => {
		acc = reducer (value) (acc)
		emit(acc)
	}
)

const filter = predicate => emitter => DerivedEmitter([ emitter ], (emit, { value }) => predicate(value) && emit(value))

const flatMap = f => emitter => DerivedEmitter(fold (v => acc => acc.concat(f(v))) ([]) (emitter))

const flatten = flatMap (identity)

const switchMap = f => emitter => DerivedEmitter(map (v => [ f(v) ]) (emitter))

const switchLatest = switchMap (identity)

const recentN = n => fold
	(v => acc => [ ...acc.slice(Math.max(0, acc.length - n + 1)), v ])
	([])

const bufferTo = notifier => source => {
	const bufferedValues = []
	const dependencies = [
		notifier,
		source
	]
	const handlers = [
		(value, emit) => emit(bufferedValues.splice(0, bufferedValues.length)),
		(value) => bufferedValues.push(value)
	]
	return DerivedEmitter(dependencies, (emit, { index, value }) => handlers[index](value, emit))
}

const createProxy = ({ create, switchLatest, push }) => {
	const dependency = create()
	const e = switchLatest (dependency)
	const mirror = me => {
		dependency[push](me)
		return me
	}
	return Object.assign(e, { mirror })
}

const proxy = () => createProxy ({ create, switchLatest, push: 'emit' })

// const bufferN = n => startEvery => source => {
// 	return filter
// 		(buffer => buffer.length === n)
// 		(snapshot (identity) (Behavior.bufferN (n) (startEvery) (source)) (source))
// }

// const pairwise = bufferN (2) (1)

// const snapshot = fn => behavior => emitter => map (value => fn(behavior.sample(), value)) (emitter)

export {
	concat,
	concatAll,
	constant,
	create,
	createProxy,
	filter,
	flatMap,
	flatten,
	map,
	proxy,
	recentN,
	fold,
	switchMap,
	switchLatest,
	bufferTo
}
