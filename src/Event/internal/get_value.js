export const get_value = (instant, x) => {
	const cache = instant.cache.get(x.occurrences)
	if (cache) {
		return cache.value
	} else {
		const value = x.compute(instant)
		instant.cache.set(x, { value })
		return value
	}
}

// TODO: should the cache be `{ value }` or just `value` ?
// export const get_value = (instant, x) => {
// 	if (instant.cache.has(x)) {
// 		return instant.cache.get(x)
// 	}
// 	const value = x.compute(instant)
// 	instant.cache.set(x, value)
// 	return value
// }
