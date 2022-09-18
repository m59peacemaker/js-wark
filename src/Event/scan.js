import { forward_reference } from '../Dynamic/forward_reference.js'
import { hold } from './hold.js'
import { snapshot } from './snapshot.js'

export const scan = f => initial_value => event =>
	forward_reference (x =>
		hold
			(initial_value)
			(snapshot (f) (x) (event))
	)
