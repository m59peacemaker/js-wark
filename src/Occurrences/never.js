import { no_op_x2 } from '../util/no_op_x2.js'

export const never = {
	compute: () => false,
	join_propagation: no_op_x2
}
