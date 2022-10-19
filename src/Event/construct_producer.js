import { _nothing } from './internal/_nothing.js'
import { create as create_instant } from '../Instant/create.js'
import { no_op_x2 } from '../util/no_op_x2.js'
import { produce } from './internal/produce.js'

export const construct_producer = f => {
	let instant = null
	const self = {
		instant: () => instant,
		dependants: new Set(),
		observe: no_op_x2
	}

	f(x => {
		instant = create_instant()
		produce(self, instant, x)
		instant = null
	})

	return self
}
