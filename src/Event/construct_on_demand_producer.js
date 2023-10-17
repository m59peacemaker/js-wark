import {
	construct_on_demand_producer as _construct_on_demand_producer
} from '../Occurrences/construct_on_demand_producer.js'
import { never_occurs } from '../Occurrences/never_occurs.js'

export const construct_on_demand_producer = producer_f => ({
	occurrences: _construct_on_demand_producer (producer_f),
	completion: never_occurs,
	is_complete: false
})
