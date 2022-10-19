export const produce = (instant, dependants, self, value) => {
	instant.cache.set(self, {
		computed: true,
		value
	})
	for (const f of dependants.values()) {
		f(instant)
	}
	for (const f of instant.computations) {
		f(instant)
	}
	for (const f of instant.post_computations) {
		f(instant)
	}
}
