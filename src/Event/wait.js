// import { once } from './once.js'
import { construct_weak_producer } from './construct_weak_producer.js'

export const wait = ({ ms }) =>
	// TODO: once
	// once (
		construct_weak_producer (produce => {
			const timeout = setTimeout (() => produce (ms), ms)
			timeout.unref && timeout.unref()
			return () => clearTimeout (timeout)
		})
	// )
