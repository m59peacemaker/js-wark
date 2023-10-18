import { never_occurs } from '../Occurrences/never_occurs.js'
import { of } from '../Variable/of.js'

export const never = ({
	occurrences: never_occurs,
	is_complete: of(true)
})
