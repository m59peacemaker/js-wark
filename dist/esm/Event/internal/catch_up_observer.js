import { nothing } from './nothing.js';

const catch_up_observer = (event, observer, cycle_allowed) => {
	if (!event.settled || event.value !== nothing) {
		observer.pre_compute(event, cycle_allowed);
	}
	if (event.value !== nothing) {
		observer.compute(event);
	}
};

export { catch_up_observer };
