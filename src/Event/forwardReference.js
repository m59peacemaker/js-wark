import { create } from './create'
import { switchLatest } from './switchLatest'

export const forwardReference = () => {
	const dependency = create()
	const ref = switchLatest (dependency)
	const assign = event => {
		dependency.occur(event)
		return event
	}
	return Object.assign(ref, { assign })
}
