const get_computation = (compute, instant) => {
	const cache = instant.cache.get(compute);
	if (cache) {
		return cache
	} else {
		const cache = {};
		instant.cache.set(compute, cache);
		/*
			It is odd to call `compute` here,
			but the calling code always at least calls `is_occurring` next,
			which leads to calling `compute`,
			so it is efficient to call and cache it now,
			so `is_occurring` can always use the cached value.
		*/
		cache.compute_value = typeof compute === 'object'
			?
				// compute function belongs to a producer and it is not occurring right now
				false
			:
				compute(instant);
		return cache
	}
};

const get_value = computation => {
	if ('value' in computation) {
		return computation.value
	} else {
		return computation.value = computation.compute_value()
	}
};

/*
	Since operators always call `get_computation` and then `is_occurring`,
	`get_computation` has already cached the first step of the computation,
	so just use the cached value here.
	Otherwise, the code would be:
	const is_occurring = computation => {
		if ('compute_value' in computation === false) {
			computation.compute_value = computation.compute()
		}
		return computation.compute_value !== false
	}
*/
const is_occurring = computation => computation.compute_value !== false;

export { get_computation, get_value, is_occurring };
