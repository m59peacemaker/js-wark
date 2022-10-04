export const construct = f => {
	const cache = { time: Symbol(), value: null }
	return {
		run: time => {
			cache.time === time || Object.assign(cache, { time, value: f (time) })
			return cache.value
		}
	}
}
