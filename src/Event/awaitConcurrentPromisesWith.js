import { switchMap } from './switchMap.js'
import { chain } from '../Dynamic/chain.js'
import { constant } from '../Dynamic/constant.js'
import { fold } from '../Dynamic/fold.js'
import { toggle } from '../Dynamic/toggle.js'

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
		({ pending: constant (false), promises: [], event: null })
		(eventOfPromise)
	const pending = chain (({ pending }) => pending) (state)
	return Object.assign(switchMap (({ event }) => event) (state.update), { pending })
}
