import { _nothing } from './internal/_nothing.js'
import { create as create_instant } from '../Instant/create.js'
import { no_op_x2 } from '../util/no_op_x2.js'
import { produce } from './internal/produce.js'

export const construct_producer = f => {
	const dependants = new Map()
	let instant = null

	const self = {
		instant: () => instant,
		observe: no_op_x2,
		join_propagation: f => {
			const id = Symbol()
			dependants.set(id, f)
			return () => dependants.delete(id)
		}
	}

	f(x => {
		instant = create_instant()
		produce(instant, dependants, self, x)
		instant = null
	})

	return self
}
