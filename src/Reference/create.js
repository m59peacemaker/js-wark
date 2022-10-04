import { construct } from './construct.js'

export const create = () => {
	let assign
	const reference = construct(x => {
		assign = x
	})
	reference.assign = assign
	return reference
}
