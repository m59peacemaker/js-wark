import { identity, noop, pipe } from '../util'

// The implementation and operators here should be nothing more than what is used to implement Event.

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
			subscribe
		}
	)
}

const forward = (emit, { value }) => emit(value)

const DerivedEmitter = (dependencies_source, fn = forward) => {
	const { emit, subscribe } = Emitter()

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

export const fold = reducer => acc => emitter => DerivedEmitter(
	[ emitter ],
	(emit, { value }) => {
		acc = reducer (value) (acc)
		emit(acc)
	}
)

export const filter = predicate => emitter => DerivedEmitter([ emitter ], (emit, { value }) => predicate(value) && emit(value))

export const switchMap = f => emitter => DerivedEmitter(map (v => [ f(v) ]) (emitter))

// This could be built on fold and filter, but this seems oddly nicer. Maybe there's a better higher level way.
export const bufferTo = notifier => source => {
	const bufferedValues = []
	const handlers = [
		(value, emit) => emit(bufferedValues.splice(0, bufferedValues.length)),
		(value) => bufferedValues.push(value)
	]
	return DerivedEmitter([ notifier, source ], (emit, { index, value }) => handlers[index](value, emit))
}

export const map = f => fold (v => () => f(v)) ()

export const constant = v => map (() => v)
