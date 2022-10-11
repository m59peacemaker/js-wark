import { nothing } from './internal/nothing.js';
import { produce } from './internal/produce.js';
import { never } from './never.js';
import { catch_up_observer } from './internal/catch_up_observer.js';

const registry = new FinalizationRegistry(cleanup => cleanup());

// TODO: maybe rename to weak_producer. contingent_producer sounds like something that would take a reference to something and be eligible for garbage collection when that reference is eligible for garbage collection.
const contingent_producer = producer_function => {
	const self = {
		computed: null,
		occurred: null,
		complete: never,
		observers: new Map(),
		settled: true,
		value: nothing,
		observe: observer => {
			const self = ref.deref();
			if (!self) { return }
			const id = Symbol();
			self.observers.set(id, observer);

			catch_up_observer (self, observer);

			return () => {
				const self = ref.deref();
				if (!self) { return }
				self.observers.delete(id);
			}
		}
	};

	const ref = new WeakRef(self);
	
	registry.register(self, producer_function (x => {
		const self = ref.deref();
		if (!self) { return }
		return produce(self, x)
	}));

	return self
};

export { contingent_producer };
