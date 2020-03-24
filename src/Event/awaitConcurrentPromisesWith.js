import { switchMap } from './switchMap'
import { chain, constant as Dynamic_constant, fold, toggle } from '../Dynamic'

const stateFromPromises = f => promises => {
	const { event, resolved } = f(promises)
	return {
		pending: toggle (true) (resolved),
		promises,
		event
	}
}

export const awaitConcurrentPromisesWith = f => eventOfPromise => {
	const state = fold
		(promise => ({ pending, promises }) => stateFromPromises (f) (pending.sample() ? [ ...promises, promise ] : [ promise ] ))
		({ pending: Dynamic_constant(false), promises: [], event: null })
		(eventOfPromise)
	const pending = chain (({ pending }) => pending) (state)
	return Object.assign(switchMap (({ event }) => event) (state.update), { pending })
}
