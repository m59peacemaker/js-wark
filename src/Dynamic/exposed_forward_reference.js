// TODO: import { forward_reference as Event_exposed_forward_reference } from '../Event/exposed_forward_reference.js'
import { forward_reference as Event_exposed_forward_reference } from '../Event/forward_reference.js'

export const exposed_forward_reference = () => {
	let assigned

	const reference = {
		run: () => assigned.run(),
		updates: Event_exposed_forward_reference(),
		assign: dynamic => {
			assigned = dynamic
			reference.updates.assign(dynamic.updates)
			return dynamic
		}
	}

	return reference
}
