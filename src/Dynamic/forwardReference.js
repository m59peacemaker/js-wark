import { assemble } from './assemble.js'
import { forwardReference as Event_forwardReference } from '../Event/forwardReference.js'
import { createForwardReference as Behavior_createForwardReference } from '../Behavior/createForwardReference.js'

export const forwardReference = () => {
	const b_ref = Behavior_createForwardReference({ pre_assign_sample_error_message: 'Dynamic forwardReference should not be sampled before being assigned!' })
	const e_ref = Event_forwardReference()

	const assign = dynamic => {
		b_ref.assign(dynamic)
		e_ref.assign(dynamic.update)
		return dynamic
	}

	return Object.assign(assemble (b_ref) (e_ref), { assign })
}
