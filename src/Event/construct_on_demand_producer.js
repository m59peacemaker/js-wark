import {
	construct_on_demand_producer as Occurrences_construct_on_demand_producer
} from '../Occurrences/construct_on_demand_producer.js'
import { of as Variable_of } from '../Variable/of.js'

export const construct_on_demand_producer = producer_f => ({
	occurrences: Occurrences_construct_on_demand_producer (producer_f),
	is_complete: Variable_of (false)
})
