import { nothing } from './internal/nothing.js';
import { catch_up_observer } from './internal/catch_up_observer.js';
import { pre_compute_observers } from './internal/pre_compute_observers.js';
import { compute_observers } from './internal/compute_observers.js';
import { _call } from '../Reference/call.js';
import { _use } from '../Reference/use.js';

const _calling = (f, input_event, input_event_complete) => {
	const observers = new Map();
	let unobserve_input_event;

	const self = {
		computed: null,
		occurred: null,
		complete: input_event_complete,
		observers,
		settled: true,
		value: nothing,
		observe: observer => {
			const id = Symbol();

			catch_up_observer(self, observer, false);

			observers.set(id, observer);
			return () => observers.delete(id)
		}
	};

	_use(
		input_event.observe,
		input_event_observe => {
			unobserve_input_event = input_event_observe({
				pre_compute: (dependency, cycle_allowed) => {
					self.computed = dependency.computed;
					self.settled = false;
					pre_compute_observers(self, cycle_allowed);
				},
				compute: () => {
					const { post_propagation } = self.computed;
					if (self.settled) {
						return
					}
					self.settled = true;
					if (input_event.value !== nothing) {
						self.occurred = self.computed;
						self.value = f (input_event.value);
						post_propagation.add(() => self.value = nothing);
					}
					compute_observers(self);
				}
			});
		}
	);

	/*
		This is the essence of the implementation of `complete_when`.
		The `complete` property of an event may actually be an event that occurs many times,
		but only one occurrence of a complete event is observed,
		making it effectively true that the complete event only occurs once.
	*/
	_call(input_event_complete.observe, input_event_complete_observe => {
		let instant;
		const unobserve_input_event_complete_event = input_event_complete_observe({
			pre_compute: dependency => {
				instant = dependency.computed;
			},
			compute: () => {
				if (input_event_complete.value !== nothing) {
					instant.post_propagation.add(() => {
						unobserve_input_event();
						unobserve_input_event_complete_event();
					});
				}
			}
		});
	});

	return self
};

const calling = f => input_event =>
	_use(input_event, input_event =>
		_use(input_event.complete, input_event_complete =>
			_calling (f, input_event, input_event_complete)
		)
	);

export { _calling, calling };