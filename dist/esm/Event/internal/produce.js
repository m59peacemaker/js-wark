import { nothing } from './nothing.js';
import { compute_observers } from './compute_observers.js';
import { pre_compute_observers } from './pre_compute_observers.js';
import { create_instant } from '../../create_instant.js';
import { run_post_instant } from '../../run_post_instant.js';

const produce = (event, value) => {
	const instant = create_instant();
	event.computed = instant;
	event.occurred = instant;
	event.value = value;
	pre_compute_observers(event, false);
	compute_observers(event);
	event.value = nothing;
	run_post_instant(instant);
};

export { produce };
