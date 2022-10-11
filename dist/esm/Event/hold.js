import { nothing } from './internal/nothing.js';
import { noop } from '../util.js';
import { _call } from '../Reference/call.js';
import { _use } from '../Reference/use.js';

const registry = new FinalizationRegistry(unobserve => unobserve());

const _hold = (initial_value, event, event_complete) => {
	let value = initial_value;

	const self = {
		run: () => value,
		updates: event
	};

	_call(event.observe, event_observe => {
		_call(event_complete.observe, event_complete_observe => {
			const unobserve = event_observe({
				pre_compute: () => {},
				compute: () => {
					if (event.value !== nothing) {
						const update_value = event.value;
						event.computed.post_propagation.add(() => {
							// NOTE: you cannot check `event.value` here, as it will already be set back to `nothing`.
							value = update_value;
						});
					}
				}
			});
			/*
				NOTE: In the implementation, whether an Event is complete can be checked by `event.complete.occurred !== null`.
				Statefully observing an event requires also observing its complete event,
				so that the complete event's occurrence time property is updated when it should occur.
			*/
			const unobserve_complete = event_complete_observe({
				pre_compute: noop,
				compute: () => {
					if (event_complete.value !== nothing) {
						// TODO: this breaks garbage collection because it references `self`... so does this need to be done differently or is it unnecessary?
						// registry.unregister(self)
						unobserve();
						unobserve_complete();
					}
				}
			});

			registry.register(self, () => {
				unobserve();
				unobserve_complete();
			});
		});
	});

	return self
};

const hold = initial_value => event =>
	_use (event, event =>
		_use (event.complete, event_complete =>
			_hold(initial_value, event, event_complete)
		)
	);

export { _hold, hold };
