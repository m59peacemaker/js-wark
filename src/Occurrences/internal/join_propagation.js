export const join_propagation = (f, { instant, propagation, propagation_counts }) => {
	const previous_count = propagation_counts.get(f) || 0
	const count = previous_count + 1
	propagation_counts.set(f, count)
	if (previous_count === 0) {
		propagation.add(f)
	}
	if (instant) {
		/*
			NOTE:
				Do not directly call the function,
				as this will inappropriately invoke it when dependants join propagation in post_propagation.
				Adding the function to `computations` will only cause it to be invoked if it is added while `computations` are being iterated and invoked.
		*/
		// TODO: there may be cases where this causes the function to be pushed to `computations` more than once in an instant
		instant.computations.push(f)
	}
	return () => {
		const previous_count = propagation_counts.get(f)
		const count = previous_count - 1
		if (count === 0) {
			propagation_counts.delete(f)
			propagation.delete(f)
		} else {
			propagation_counts.set(f, count)
		}
	}
}
