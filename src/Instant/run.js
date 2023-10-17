export const run = instant => {
	for (const f of instant.computations) {
		f(instant)
	}
	for (const f of instant.post_computations) {
		f(instant)
	}
}
