import { create } from '../../Instant/create.js';

const produce = (self, propagation, value) => {
	const instant = create();
	instant.cache.set(self.compute, { compute_value: () => value, value });
	for (const f of propagation) {
		f(instant);
	}
	for (const f of instant.post_computations) {
		f();
	}
};

export { produce };
