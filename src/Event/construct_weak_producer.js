import { _nothing } from './internal/_nothing.js'
import { produce } from './internal/produce.js'
import { create as create_instant } from '../Instant/create.js'
import { register_finalizer } from '../finalization.js'
import { no_op_x2 } from '../util/no_op_x2.js'

export const construct_weak_producer = f => {
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

	const self_ref = new WeakRef(self)

	register_finalizer(
		self,
		f(x => {
			const self = self_ref.deref()
			instant = create_instant()
			produce(instant, dependants, self, x)
			instant = null
		})
	)

	return self
}
