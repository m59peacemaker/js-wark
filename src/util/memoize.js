export const memoize = f => {
	const cache = new Map()
	return x => {
		if (cache.has(x)) {
			return cache.get(x)
		}
		const value = f(x)
		cache.set(x, value)
		return value
	}
}
