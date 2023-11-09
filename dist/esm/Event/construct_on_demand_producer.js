import { construct_on_demand_producer as construct_on_demand_producer$1 } from '../Occurrences/construct_on_demand_producer.js';
import { of } from '../Variable/of.js';

const construct_on_demand_producer = producer_f => ({
	occurrences: construct_on_demand_producer$1 (producer_f),
	completed: of (false)
});

export { construct_on_demand_producer };
