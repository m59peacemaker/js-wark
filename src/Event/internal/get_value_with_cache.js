export const get_value_with_cache = (instant, cache, x) => {
	if (cache.computed === false) {
		cache.computed = true
		cache.value = x.compute(instant)
	}
	return cache.value
}
