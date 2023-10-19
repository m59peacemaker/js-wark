import {
	construct_on_demand_producer as _construct_on_demand_producer
} from '../Occurrences/construct_on_demand_producer.js'
import { of } from '../Variable/of.js'

export const construct_on_demand_producer = producer_f => ({
	occurrences: _construct_on_demand_producer (producer_f),
	is_complete: of(false)
})
