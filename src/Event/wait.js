import { once } from './once.js'
import { contingent_producer } from './contingent_producer.js'

export const wait = ({ ms, value }) =>
	once (
		contingent_producer (produce => {
			const timeout = setTimeout (() => produce (value), ms)
			timeout.unref && timeout.unref()
			return () => clearTimeout (timeout)
		})
	)
