import { construct_producer as construct_producer$1 } from '../Occurrences/construct_producer.js';
import { of } from '../Variable/of.js';

const construct_producer = f => ({
	occurrences: construct_producer$1 (f),
	completed: of (false)
});

export { construct_producer };
