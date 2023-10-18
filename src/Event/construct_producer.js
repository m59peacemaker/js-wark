import { construct_producer as _construct_producer } from '../Occurrences/construct_producer.js'
import { of } from '../Variable/of.js'

export const construct_producer = f => ({
	occurrences: _construct_producer(f),
	is_complete: of(false)
})
