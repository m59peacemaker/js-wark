import { construct_producer as Occurrences_construct_producer } from '../Occurrences/construct_producer.js'
import { of as Variable_of } from '../Variable/of.js'

export const construct_producer = f => ({
	occurrences: Occurrences_construct_producer (f),
	is_complete: Variable_of (false)
})
