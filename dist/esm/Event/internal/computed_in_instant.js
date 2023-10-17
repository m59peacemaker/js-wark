const computed_in_instant = (instant, x) => {
	const cache = instant.cache.get(x);
	return cache && cache.computed
};

export { computed_in_instant };
