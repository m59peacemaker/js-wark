import { forwardReference, hold } from './'
import { snapshot } from '../Event'

export const fold = reducer => initialValue => event => {
	const p = forwardReference()
	return p.assign(
		hold
			(initialValue)
			(snapshot (b => a => reducer (a) (b)) (p) (event))
	)
}
