export const construct = f => {
	const self = {
		perform: instant => {
			if (!instant.cache.has(self)) {
				instant.cache.set(self, f(instant))
			}
			return instant.cache.get(self)
		}
	}
	return self
}
