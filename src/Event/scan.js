import { forward_reference } from '../reference.js'
import { snapshot } from './snapshot.js'
import { updating } from './updating.js'
import { eagerly, deferred } from './updating.js'

export const scan = f => initial_value => event =>
	updating
		(eagerly)
		(initial_value)
		(forward_reference (x =>
			snapshot
				(f)
				(updating (deferred) (initial_value) (x))
				(event)
		))
