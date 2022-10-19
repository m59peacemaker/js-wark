import { _nothing } from './internal/_nothing.js'
import { no_op } from '../util/no_op.js'
import { no_op_x2 } from '../util/no_op_x2.js'

export const never = ({
	instant: () => null,
	compute: () => _nothing,
	observe: no_op_x2,
	propagate: no_op,
	dependants: { add: no_op, delete: no_op }
})
