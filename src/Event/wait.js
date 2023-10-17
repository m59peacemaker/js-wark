import { construct_weak_producer } from './construct_weak_producer.js'
import { complete_when } from './complete_when.js'

/*
	it seems like it will be more efficient to derive this directly,
	rather than `construct_weak_producer`,
	because then it requires extra work to derive is_complete

	TODO: write this without any abstraction and then see if it can be more generalized
*/
export const wait = ({ ms }) => {
	// TODO: efficient implementation rather than construct_weak_producer followed by complete_when
	const producer = construct_weak_producer (produce => {
		const timeout = setTimeout (() => produce (ms), ms)
		return () => clearTimeout (timeout)
	})
	return complete_when (producer) (producer)
}
