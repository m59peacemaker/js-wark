import { get_value } from './internal/get_value.js';
import { _nothing } from './internal/_nothing.js';
import { nothing } from './nothing.js';

const merge_2_with = f => a => b => {
	const self = {
		instant: () => a.instant() || b.instant(),
		compute: instant => {
			const a_value = get_value (instant, a);
			const b_value = get_value (instant, b);
			const value = a_value === _nothing && b_value === _nothing
				? _nothing
				:
					f
						(a_value === _nothing ? nothing : a_value)
						(b_value === _nothing ? nothing : b_value);
			return value === nothing ? _nothing : value
		},
		propagate: instant => {
			if (!instant.cache.has(self)) {
				instant.cache.set(self, { computed: false, value: _nothing });
				for (const dependant of self.dependants) {
					dependant.propagate(instant);
				}
			}
		},
		dependants: new Set()
	};

	a.dependants.add(self);
	b.dependants.add(self);

	const instant = self.instant();
	if (instant !== null) {
		instant.cache.set(self, { computed: false, value: _nothing });
	}

	return self
};

export { merge_2_with };
