import { create } from './create.js'
import { switchLatest } from './switchLatest.js'

export const forwardReference = () => {
	const dependency = create()
	const ref = switchLatest (dependency)
	const assign = event => {
		dependency.occur(event)
		return event
	}
	return Object.assign(ref, { assign })
}
