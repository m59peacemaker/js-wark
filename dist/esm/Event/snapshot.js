import { nothing } from './internal/nothing.js';
import { catch_up_observer } from './internal/catch_up_observer.js';
import { compute_observers } from './internal/compute_observers.js';
import { pre_compute_observers } from './internal/pre_compute_observers.js';
import { _use } from '../Reference/use.js';

const _snapshot = (f, sample, input_event) => {
	const observers = new Map();

	let unobserve_input_event;

	const self = {
		computed: null,
		occurred: null,
		complete: input_event.complete,
		observers,
		settled: true,
		value: nothing,
		observe: observer => {
			const id = Symbol();
			observers.set(id, observer);
			if (observers.size === 1) {
				_use(input_event.observe, input_event_observe => {
					unobserve_input_event = input_event_observe(input_event_observer);
				});
			}

			catch_up_observer (self, observer, false);

			return () => {
				observers.delete(id);
				if (observers.size === 0) {
					unobserve_input_event();
				}
			}
		}
	};

	const input_event_observer = {
		pre_compute: (dependency, cycle_allowed) => {
			self.computed = dependency.computed;
			self.settled = false;
			pre_compute_observers(self, cycle_allowed);
		},
		compute: () => {
			const { post_propagation } = self.computed;
			self.settled = true;
			if (input_event.value !== nothing) {
				self.occurred = self.computed;
				self.value = f (sample.run(self.computed)) (input_event.value);
				post_propagation.add(() => self.value = nothing);
			}
			compute_observers(self);
		}
	};

	return self
};

const snapshot = f => sample => input_event =>
	_use(sample, sample =>
		_use(input_event, input_event =>
			_snapshot (f, sample, input_event)
		)
	);

export { _snapshot, snapshot };
