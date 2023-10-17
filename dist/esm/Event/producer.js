import { create } from '../Instant/create.js';

const producer = f => {
	let instant = null;
	const self = {
		instant: () => instant,
		dependants: new Set()
	};

	f(x => {
		instant = create();
		instant.cache.set(self, {
			computed: true,
			value: x
		});
		for (const dependant of self.dependants) {
			dependant.propagate(instant);
		}
		for (const f of instant.computations) {
			f(instant);
		}
		for (const f of instant.post_computations) {
			f(instant);
		}
		instant = null;
	});

	return self
};

export { producer };
