import { assemble } from './assemble.js'
import { tag } from '../Event/tag.js'

export const transformBehavior = f => dynamic => {
	const behavior = f(dynamic)
	return assemble
		(behavior)
		(tag (behavior) (dynamic.update))
}
