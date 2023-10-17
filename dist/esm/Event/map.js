import { get_value } from './internal/get_value.js';
import { _nothing } from './internal/_nothing.js';

const map = f => x => {
	const self = {
		instant: x.instant,
		compute: instant => {
			const x_value = get_value(instant, x);
			return x_value === _nothing ? _nothing : f(x_value)
		},
		propagate: instant => {
			if (!instant.cache.has(self)) {
				instant.cache.set(self, { computed: false, value: _nothing });
				// TODO: dependants can just be the propagate functions, instead of the objects
				for (const d of self.dependants) {
					d.propagate(instant);
				}
			}
		},
		dependants: new Set(),
	};

	x.dependants.add(self);

	const instant = x.instant();
	if (instant !== null) {
		instant.cache.set(self, { computed: false, value: _nothing });
	}

	return self
};

export { map };
