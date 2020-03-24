import { noop } from '../util'
import { assignEventMetaProperties } from './assignEventMetaProperties'

export const never = () => {
	const subscribe = () => noop
	return assignEventMetaProperties({
		t: () => null,
		subscribe,
		occurrence_pending: { emit: noop, subscribe },
	})
}


