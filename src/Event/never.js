import { assignEventMetaProperties } from './assignEventMetaProperties.js'
import { noop } from '../util.js'

export const never = () => {
	const subscribe = () => noop
	return assignEventMetaProperties({
		t: () => null,
		subscribe,
		occurrence_pending: { emit: noop, subscribe },
	})
}


