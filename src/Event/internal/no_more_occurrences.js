import { _nothing } from './_nothing.js'
import { no_op_x2 } from '../../util/no_op_x2.js'

export const no_more_occurrences = has_occurred => ({
	has_occurred,
	instant: () => null,
	compute: () => _nothing,
	observe: no_op_x2,
	join_propagation: no_op_x2
})
