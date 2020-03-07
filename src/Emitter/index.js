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

export const create = Emitter

export const concatAll = emitters => DerivedEmitter(emitters)

export const concat = a => b => concatAll([ a, b ])

export const map = f => emitter => DerivedEmitter([ emitter ], (emit, { value }) => emit(f(value)))

export const constant = v => map (() => v)

export const fold = reducer => acc => emitter => DerivedEmitter(
	[ emitter ],
	(emit, { value }) => {
		acc = reducer (value) (acc)
		emit(acc)
	}
)

export const filter = predicate => emitter => DerivedEmitter([ emitter ], (emit, { value }) => predicate(value) && emit(value))

export const flatMap = f => emitter => DerivedEmitter(fold (v => acc => acc.concat(f(v))) ([]) (emitter))

export const flatten = flatMap (identity)

export const switchMap = f => emitter => DerivedEmitter(map (v => [ f(v) ]) (emitter))

export const switchLatest = switchMap (identity)

export const recentN = n => fold
	(v => acc => [ ...acc.slice(Math.max(0, acc.length - n + 1)), v ])
	([])

export const bufferTo = notifier => source => {
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

export const createProxy = ({ create, switchLatest, push }) => {
	const dependency = create()
	const e = switchLatest (dependency)
	const mirror = me => {
		dependency[push](me)
		return me
	}
	return Object.assign(e, { mirror })
}

export const proxy = () => createProxy ({ create, switchLatest, push: 'emit' })
