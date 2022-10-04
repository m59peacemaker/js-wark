import { use } from './use.js'
import { use2 } from './use2.js'

export const array = use
		(array =>
			array.reduce(
				(acc, x) => use2 (acc => x => [ ...acc, x ]) (acc) (x),
				[]
			)
		)
