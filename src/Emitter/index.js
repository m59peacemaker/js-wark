import { noop, pipe } from '../util.js'

// The implementation and operators here should be nothing more than what is used to implement Event.

export const create = () => {
	const subscribers = new Map()
	return {
		emit: value => Array.from(subscribers.values()).map(subscriber => subscriber(value)),
		subscribe: subscriber => {
			const id = Symbol()
			subscribers.set(id, subscriber)
			return () => subscribers.delete(id)
		}
	}
}

const emit_identity = (emit, { value }) => emit(value)

export const derive = dependencies_source => f => {
	const { emit, subscribe } = create()

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

export const map = f => e => derive ([ e ]) ((emit, { value }) => emit(f(value)))

export const switchMap = f => emitter => derive (map (v => [ f(v) ]) (emitter)) (emit_identity)
