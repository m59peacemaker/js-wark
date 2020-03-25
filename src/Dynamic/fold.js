import { forwardReference } from './forwardReference.js'
import { hold } from './hold.js'
import { snapshot } from '../Event/snapshot.js'

export const fold = reducer => initialValue => event => {
	const p = forwardReference()
	return p.assign(
		hold
			(initialValue)
			(snapshot (b => a => reducer (a) (b)) (p) (event))
	)
}
