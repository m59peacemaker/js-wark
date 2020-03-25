export const create = f => {
	const cache = { t: Symbol(), value: null }
	return {
		sample: t => {
			cache.t === t || Object.assign(cache, { t, value: f(t) })
			return cache.value
		}
	}
}
