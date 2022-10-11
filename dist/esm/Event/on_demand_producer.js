import { nothing } from './internal/nothing.js';
import { produce } from './internal/produce.js';
import { never } from './never.js';
import { catch_up_observer } from './internal/catch_up_observer.js';

/*
	`on_demand_producer` calls its `producer_function` only when it gains an observer from having no observers.
	It calls the cleanup function returned by its `producer_function` when an observer stop observing and there are no remaining observers.
	Only stateful observers observe their dependencies when they are not being observed, so only a stateful observer would cause this producer to call its `producer_function`.
*/
const on_demand_producer = producer_function => {
	const observers = new Map();
	let deactivate;

	const self = {
		computed: null,
		occurred: null,
		complete: never,
		observers,
		settled: true,
		value: nothing,
		observe: observer => {
			const id = Symbol();
			observers.set(id, observer);

			if (observers.size === 1) {
				deactivate = producer_function (self_produce);
			}

			// TODO: should this be wrapped in `else { }` ?
			catch_up_observer (self, observer);

			return () => {
				observers.delete(id);
				if (observers.size === 0) {
					deactivate();
				}
			}
		}
	};

	const self_produce = x => produce(self, x);

	return self
};

export { on_demand_producer };
