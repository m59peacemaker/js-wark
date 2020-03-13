import { identity, noop, pipe } from '../util'

// The implementation and operators here should be nothing more than what is used to implement Event.

function Emitter () {
	const subscribers = new Map()
	return {
		emit: value => {
			Array.from(subscribers.values()).map(subscriber => subscriber(value))
		},
		subscribe: subscriber => {
			const id = Symbol()
			subscribers.set(id, subscriber)
			return () => subscribers.delete(id)
		}
	}
}

const forward = (emit, { value }) => emit(value)

const DerivedEmitter = (dependencies_source, f = forward) => {
	const { emit, subscribe } = Emitter()

	let unsubscribe_from_dependencies = noop
	const subscribe_to_dependencies = dependencies => {
		unsubscribe_from_dependencies()
		unsubscribe_from_dependencies = pipe(dependencies.map((dependency, index) => dependency.subscribe(value => f(emit, { value, index }))))
	}

	Array.isArray(dependencies_source) ? subscribe_to_dependencies(dependencies_source) : dependencies_source.subscribe(subscribe_to_dependencies)

	return {
		subscribe
	}
}

export const create = Emitter

export const derive = DerivedEmitter

export const concatAll = emitters => DerivedEmitter(emitters)

export const combineAllWith = f => emitters => DerivedEmitter(emitters, (emit, { value, index }) => emit(f({ value, index })))

export const fold = reducer => acc => emitter => DerivedEmitter(
	[ emitter ],
	(emit, { value }) => {
		acc = reducer (value) (acc)
		emit(acc)
	}
)

export const filter = predicate => emitter => DerivedEmitter([ emitter ], (emit, { value }) => predicate(value) && emit(value))

export const switchMap = f => emitter => DerivedEmitter(map (v => [ f(v) ]) (emitter))

export const map = f => e => DerivedEmitter([ e ], (emit, { value }) => emit(f(value)))

export const constant = v => map (() => v)
