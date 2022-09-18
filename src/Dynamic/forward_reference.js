import { exposed_forward_reference } from './exposed_forward_reference.js'

export const forward_reference = f => {
	const reference = exposed_forward_reference()
	return reference.assign(f (reference))
}
