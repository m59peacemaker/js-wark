import { map } from './map.js';
import { merge_2_with } from './merge_2_with.js';
import { nothing } from './nothing.js';
import { update } from '../util.js';

// TODO: implement efficient merge for many events rather than implementing this from merge_2_with
const merge_array = events => {
	const nothings = events.map(() => nothing);
	return events
		.slice(1)
		.reduce(
			(acc, x, i) =>
				merge_2_with
					(a => b => update (i + 1) (b) (a === nothing ? nothings : a))
					(acc)
					(x)
			,
			map
				(x => [ x, ...nothings.slice(1) ])
				(events[0])
		)
};

export { merge_array };
