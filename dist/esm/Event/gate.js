import { filter } from './filter.js';
import { tag } from './tag.js';
import { identity } from '../util.js';

const gate = sample => event =>
	filter
		(identity)
		(tag
			(sample)
			(event)
		);

export { gate };
