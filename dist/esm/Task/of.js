import { catch_up_observer } from '../Event/internal/catch_up_observer.js';

const of = value => ({
	run: instant => {
		const observers = new Map();

		const event = {
			computed: instant,
			occurred: instant,
			observers,
			settled: true,
			value,
			observe: observer => {
				const id = Symbol();
				observers.set(id, observer);

				catch_up_observer (event, observer);

				return () => observers.delete(id)
			}
		};

		event.complete = event;

		return event
	}
});

export { of };
