export const produce = (self, instant, value) => {
	instant.cache.set(self, {
		computed: true,
		value
	})
	for (const dependant of self.dependants) {
		dependant.propagate(instant)
	}
	for (const f of instant.computations) {
		f(instant)
	}
	for (const f of instant.post_computations) {
		f(instant)
	}
}
