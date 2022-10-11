const construct = f => {
	let cache_instant = Symbol();
	let cache_value = null;
	return {
		run: instant => {
			if (instant !== cache_instant) {
				cache_instant = instant;
				cache_value = f (instant);
			}
			return cache_value
		}
	}
};

export { construct };
